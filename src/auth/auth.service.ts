import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { TempOtpService } from './services/temp-otp.service';
import { RegisterDto } from './dto/register.dto';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private mailer: nodemailer.Transporter;

  constructor(
    private readonly userService: UserService,
    private readonly tempOtpService: TempOtpService,
    private readonly jwtService: JwtService,
  ) {
    this.initializeMailer();
  }

  private initializeMailer() {
    this.mailer = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      await this.mailer.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'NextRide Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 400px; margin: 0 auto;">
              <h2 style="color: #333; text-align: center;">Email Verification</h2>
              <p style="color: #666; text-align: center; margin: 20px 0;">
                Use the following OTP to verify your email address:
              </p>
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <h1 style="color: #0ea5e9; letter-spacing: 5px; margin: 0; font-size: 32px;">${otp}</h1>
              </div>
              <p style="color: #999; text-align: center; font-size: 12px;">
                This OTP will expire in 10 minutes.
              </p>
              <p style="color: #666; text-align: center; margin-top: 20px; font-size: 12px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async register(registerDto: RegisterDto, file?: Express.Multer.File) {
    try {
      const { name, email, phone, password, role } = registerDto;

      // Create user with optional file path
      const filePath = file ? file.path : undefined;
      const user = await this.userService.createUser(
        name,
        email,
        phone,
        password,
        role,
        filePath,
      );

      // Generate and store OTP (expires in 3 minutes)
      const otp = this.generateOtp();
      await this.tempOtpService.storeOtp(email, otp, 3);

      // Send OTP email
      await this.sendOtpEmail(email, otp);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toObject();

      return {
        success: true,
        message: 'Registration successful. OTP sent to your email.',
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error.message === 'Email already registered') {
        throw new BadRequestException('Email already registered');
      }
      throw error;
    }
  }

  async verifyEmail(email: string, otp: string) {
    // Verify OTP (throws BadRequestException if invalid/expired)
    await this.tempOtpService.verifyOtp(email, otp);

    // Mark user as verified
    const user = await this.userService.verifyUser(email);

    // Remove OTP from database
    await this.tempOtpService.deleteOtp(email);

    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      success: true,
      message: 'Email verified successfully',
      user: userWithoutPassword,
    };
  }

  async resendOtp(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new OTP (expires in 3 minutes)
    const otp = this.generateOtp();
    await this.tempOtpService.storeOtp(email, otp, 3);

    // Send OTP email
    await this.sendOtpEmail(email, otp);

    return {
      success: true,
      message: 'OTP resent successfully',
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: user._id, 
      email: user.email, 
      role: user.role 
    };
    const token = this.jwtService.sign(payload);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    };
  }
}
