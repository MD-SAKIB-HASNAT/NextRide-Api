import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TempOtpService } from './services/temp-otp.service';
import { TempOtp, TempOtpSchema } from './schemas/temp-otp.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TempOtp.name, schema: TempOtpSchema }]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TempOtpService]
})
export class AuthModule {}
