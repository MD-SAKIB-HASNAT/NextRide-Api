import { Body, Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly fileUploadService: FileUploadService,
    ) {}
    
    @Post('register')
    @UseInterceptors(
        FileInterceptor('licenseFile', {
            storage: diskStorage({
                destination: './uploads/licenses',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    callback(null, `license-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, callback) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i)) {
                    return callback(new Error('Only image and document files are allowed!'), false);
                }
                callback(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
        }),
    )
    register(
        @Body() registerDto: RegisterDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.authService.register(registerDto, file);
    }

    @Post('verify-email')
    verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
        return this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.otp);
    }

    @Post('resend-otp')
    resendOtp(@Body() body: { email: string }) {
        return this.authService.resendOtp(body.email);
    }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Post('forgot-password')
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(forgotPasswordDto);
    }

    @Post('reset-password')
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
}
