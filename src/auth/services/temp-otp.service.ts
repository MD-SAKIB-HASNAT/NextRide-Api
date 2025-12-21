import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TempOtp } from '../schemas/temp-otp.schema';

@Injectable()
export class TempOtpService {
  constructor(@InjectModel(TempOtp.name) private tempOtpModel: Model<TempOtp>) {}

  async storeOtp(email: string, code: string, expiresInMinutes: number = 3): Promise<TempOtp> {
    // Delete any existing OTP for this email
    await this.tempOtpModel.deleteMany({ email });

    // Create new OTP record
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    return this.tempOtpModel.create({ email, code, expiresAt });
  }

  async getOtp(email: string): Promise<TempOtp | null> {
    return this.tempOtpModel.findOne({ email });
  }

  async verifyOtp(email: string, code: string): Promise<TempOtp> {
    const otpRecord = await this.getOtp(email);

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.deleteOtp(email);
      throw new BadRequestException('OTP has expired');
    }

    if (otpRecord.code !== code) {
      throw new BadRequestException('Invalid OTP');
    }

    return otpRecord;
  }

  async deleteOtp(email: string): Promise<void> {
    await this.tempOtpModel.deleteMany({ email });
  }
}
