import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';
import * as nodemailer from 'nodemailer';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { PaginationService, PaginationParams } from 'src/common/services/pagination.service';

@Injectable()
export class OrganizationService {
  private mailer: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private paginationService: PaginationService,
  ) {}

  private getMailer() {
    if (!this.mailer) {
      this.mailer = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return this.mailer;
  }

  private async sendStatusEmail(to: string, subject: string, body: string) {
    const mailer = this.getMailer();
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: body,
    });
  }

  async listOrganizations(filter: FilterOrganizationDto, params: PaginationParams) {
    const query: any = { role: UserRole.ORGANIZATION };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
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

  async listPendingOrganizations(filter: FilterOrganizationDto, params: PaginationParams) {
    return this.listOrganizations({ ...filter, status: UserStatus.PENDING_APPROVAL }, params);
  }

  async listActiveOrganizations(filter: FilterOrganizationDto, params: PaginationParams) {
    const activeFilter: FilterOrganizationDto = {
      ...filter,
      status: UserStatus.ACTIVE,
    };

    const query: any = { role: UserRole.ORGANIZATION, status: UserStatus.ACTIVE };

    if (activeFilter.search) {
      const regex = new RegExp(activeFilter.search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const limit = this.paginationService.clampLimit(activeFilter.limit ?? params.limit);
    const lastId = this.paginationService.decodeCursor(activeFilter.cursor ?? params.cursor);

    const items = await this.userModel
      .find(lastId ? { ...query, _id: { $gt: lastId } } : query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .select('-password -emailVerificationToken');

    const result = this.paginationService.buildResponse(items as any, limit);
    return {
      data: result.data,
      nextCursor: result.pageInfo.nextCursor,
      hasMore: result.pageInfo.hasNextPage,
    };
  }

  async getActiveOrganizationById(id: string) {
    const organization = await this.userModel
      .findOne({ _id: id, role: UserRole.ORGANIZATION, status: UserStatus.ACTIVE })
      .select('-password -emailVerificationToken');

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async approveOrganization(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ORGANIZATION) {
      throw new BadRequestException('Only organization accounts require approval');
    }

    user.status = UserStatus.ACTIVE;
    await user.save();

    try {
      await this.sendStatusEmail(
        user.email,
        'Organization account approved',
        `<p>Hi ${user.name},</p><p>Your organization account has been approved. You can now sign in and start using NextRide.</p>`,
      );
    } catch (err) {
      console.error('Failed to send approval email', err);
    }

    return { message: 'Organization approved successfully', user };
  }

  async rejectOrganization(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ORGANIZATION) {
      throw new BadRequestException('Only organization accounts require approval');
    }

    user.status = UserStatus.BLOCKED;
    await user.save();

    try {
      await this.sendStatusEmail(
        user.email,
        'Organization account rejected',
        `<p>Hi ${user.name},</p><p>Your organization account request was rejected. Please contact support if you believe this is a mistake.</p>`,
      );
    } catch (err) {
      console.error('Failed to send rejection email', err);
    }

    return { message: 'Organization rejected successfully', user };
  }
}
