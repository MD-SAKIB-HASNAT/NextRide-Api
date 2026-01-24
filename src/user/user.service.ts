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
import { UserRole, UserStatus } from 'src/common/enums/user.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { EmailService } from 'src/common/services/email.service';
import { PaginationService, PaginationParams } from 'src/common/services/pagination.service';
import { FilterUserDto } from './dto/filter-user.dto';
import { SystemSetting } from 'src/Admin/settings/schemas/system-setting.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('UserSummary') private userSummaryModel: Model<any>,
    @InjectModel(SystemSetting.name) private settingsModel: Model<SystemSetting>,
    private fileUploadService: FileUploadService,
    private emailService: EmailService,
    private paginationService: PaginationService,
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

      if(existingUser.status === UserStatus.BLOCKED){
        throw new ConflictException('This email is associated with a deactivated account. Please contact support to reactivate your account.');
      }
      else if(existingUser.emailVerified === false){
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        existingUser.name = name;
        existingUser.phone = phone;
        existingUser.password = hashedPassword;
        existingUser.role = role;
        existingUser.licenseFile = licenseFile || existingUser.licenseFile || null;
        await existingUser.save();
        return existingUser;
      }
      else if(existingUser.status === UserStatus.PENDING){
        throw new ConflictException('An account with this email already exists and is pending verification. Please check your email for the verification link or contact support for assistance.');

      }
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
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    // Organizations stay pending approval after email verification; others become active immediately.
    const nextStatus =
      user.role === UserRole.ORGANIZATION
        ? UserStatus.PENDING_APPROVAL
        : UserStatus.ACTIVE;

    user.emailVerified = true;
    user.status = nextStatus;

    await user.save();

    return user;
  }

  // Organization approval flows handled by OrganizationService

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

  async listUsers(filter: FilterUserDto, params: PaginationParams) {
    const query: any = {};

    if (filter.status) {
      query.status = filter.status;
    }

    // Default to basic users unless a specific role filter is supplied
    query.role = filter.role ?? UserRole.USER;

    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const limit = this.paginationService.clampLimit(filter.limit ?? params.limit);
    const lastId = this.paginationService.decodeCursor(filter.cursor ?? params.cursor);

    const items = await this.userModel
      .find(lastId ? { ...query, _id: { $gt: lastId } } : query)
      .sort({ _id: 1 })
      .limit(limit + 1);

    const result = this.paginationService.buildResponse(items as any, limit);
    return {
      data: result.data,
      nextCursor: result.pageInfo.nextCursor,
      hasMore: result.pageInfo.hasNextPage,
    };
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Send notification email if status changed
    if (oldStatus !== status) {
      const settings = await this.settingsModel.find();
      const supportEmail = settings?.[0]?.contactEmail || 'support@nextride.com';
      
      const statusMessages = {
        [UserStatus.ACTIVE]: 'Your account has been activated successfully! You can now access all features.',
        [UserStatus.PENDING]: 'Your account is pending. Please complete your email verification.',
        [UserStatus.PENDING_APPROVAL]: 'Your account is pending approval from our admin team. We will review your details and get back to you soon.',
        [UserStatus.BLOCKED]: 'Your account has been deactivated. If you believe this is a mistake, please contact our support team.',
      };

      const subject = `NextRide: Your Account Status Updated`;
      const html = `
        <div style="font-family: Arial, sans-serif; color:#0f172a;">
          <p>Hi ${user.name},</p>
          <p>Your account status has been updated.</p>
          <p><strong>New Status:</strong> ${status.toUpperCase()}</p>
          <p>${statusMessages[status] || 'Your account status has been updated.'}</p>
          <p>If you have any questions or concerns, please don't hesitate to contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
          <p><em>This is an automated message. Please do not reply to this email.</em></p>
          <hr />
          <p>Best regards,<br/>NextRide Team</p>
        </div>
      `;

      try {
        await this.emailService.sendEmail(user.email, subject, html);
      } catch (error) {
        // Don't block status change on email failures
        console.error('Email send failed:', error?.message || error);
      }
    }

    return {
      message: 'User status updated',
      user,
    };
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

      // Sync rent vehicle count from actual database records
      const rentVehicleModel = this.userModel.db.model('RentVehicle');
      const actualRentCount = await rentVehicleModel.countDocuments({
        ownerId: new Types.ObjectId(userId),
      });

      if (summary.rentVehicleCount !== actualRentCount) {
        summary.rentVehicleCount = actualRentCount;
        await summary.save();
      }

      return summary;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch user summary',
      );
    }
  }
}
