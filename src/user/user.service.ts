import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { UserStatus } from 'src/common/enums/user.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
}
