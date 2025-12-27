import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { UserStatus } from 'src/common/enums/user.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('UserSummary') private userSummaryModel: Model<any>,
    private fileUploadService: FileUploadService,
  ) {}

  async createUser(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: any,
    licenseFile?: string,
  ) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new this.userModel({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      status: UserStatus.PENDING,
      licenseFile: licenseFile || null,
    });

    return await newUser.save();
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  async verifyUser(email: string) {
    const user = await this.userModel.findOneAndUpdate(
      { email },
      {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
      { new: true },
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updatePassword(email: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    return user;
  }

  async updateProfile(
    userId: string,
    updateData: { name?: string; phone?: string },
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.phone) user.phone = updateData.phone;

    // Handle profile photo upload
    if (file) {
      // Delete old photo if exists
      if (user.profilePhoto) {
        await this.fileUploadService.deleteFile(user.profilePhoto);
      }
      // Save new photo path
      user.profilePhoto = file.path;
    }

    await user.save();

    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    passwordData: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      passwordData.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      passwordData.newPassword,
      saltRounds,
    );

    user.password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async getUserSummary(userId: string) {
    try {
      let summary = await this.userSummaryModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!summary) {
        summary = await this.userSummaryModel.create({
          userId: new Types.ObjectId(userId),
        });
      }

      return summary;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch user summary',
      );
    }
  }
}
