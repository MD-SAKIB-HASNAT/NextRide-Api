import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TempOtpService } from './services/temp-otp.service';
import { TempOtp, TempOtpSchema } from './schemas/temp-otp.schema';
import { AuthGuard } from './guards/auth.guard';
import { UserModule } from 'src/user/user.module';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TempOtp.name, schema: TempOtpSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TempOtpService, FileUploadService, AuthGuard],
  exports: [AuthGuard, JwtModule]
})
export class AuthModule {}
