import { Body, Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    
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
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
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
}
