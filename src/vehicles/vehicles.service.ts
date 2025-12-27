import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaymentStatus, VehicleStatus, VehicleType } from 'src/common/enums/vehicle.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PaginationService, PaginationParams, PaginatedResult } from 'src/common/services/pagination.service';
import { UserSummary } from 'src/user/schemas/user-summary.schema';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { SystemSetting } from 'src/Admin/settings/schemas/system-setting.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(UserSummary.name) private userSummaryModel: Model<UserSummary>,
    @InjectModel(SystemSetting.name) private settingsModel: Model<SystemSetting>,
    private fileUploadService: FileUploadService,
    private paginationService: PaginationService,
  ) {}

  async createVehicle(
    createVehicleDto: CreateVehicleDto,
    userId: string,
    images: any[],
    video?: any,
  ) {
    try {
      const imagePaths = await this.fileUploadService.uploadFiles(images, 'vehicles/images');
      const videoPaths = video ? await this.fileUploadService.uploadFiles([video], 'vehicles/videos') : [];

      const systemSetting = await this.settingsModel.find();
      const platformFee = createVehicleDto.price * systemSetting[0]?.commissionRate;
      
      const userObjectId = new Types.ObjectId(userId);
      const vehicle = new this.vehicleModel({
        ...createVehicleDto,
        images: imagePaths,
        video: videoPaths[0] || null,
        userId: userObjectId,
        status: VehicleStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        platformFee: platformFee,
      });

      const savedVehicle = await vehicle.save();

      // Update user summary
      await this.updateUserSummaryOnCreate(userObjectId, createVehicleDto.vehicleType);

      return savedVehicle;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to create vehicle listing',
      );
    }
  }

  async getVehiclesFiltered(
    userId: string,
    filters: VehicleFilterDto,
    params: PaginationParams,
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const limit = this.paginationService.clampLimit(params.limit);
      const lastId = this.paginationService.decodeCursor(params.cursor);

      const query: any = { userId: new Types.ObjectId(userId) };

      // Apply filters only if provided
      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }

      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      // Search by brand or model name
      if (filters.search) {
        query.$or = [
          { make: { $regex: filters.search, $options: 'i' } },
          { modelName: { $regex: filters.search, $options: 'i' } },
        ];
      }

      // Filter by brand
      if (filters.make) {
        query.make = filters.make;
      }

      // Filter by price range
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      // Filter by date range
      if (filters.fromDate || filters.toDate) {
        query.createdAt = {};
        if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }

      if (lastId) {
        query._id = { $gt: lastId };
      }

      const items = await this.vehicleModel
        .find(query)
        .sort({ _id: 1 })
        .limit(limit + 1);

      return this.paginationService.buildResponse(items as any, limit);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch filtered user vehicles',
      );
    }
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      const vehicle = await this.vehicleModel
        .findById(id)
        .populate('userId', 'name phone email role status emailVerified createdAt');

      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch vehicle details');
    }
  }

  async updateVehicleStatus(vehicleId: string, status: VehicleStatus) {
    try {
      if (!Object.values(VehicleStatus).includes(status)) {
        throw new BadRequestException('Invalid vehicle status');
      }

      const vehicle = await this.vehicleModel.findById(vehicleId);

      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      const oldStatus = vehicle.status;
      vehicle.status = status;
      const updated = await vehicle.save();

      if (oldStatus !== status) {
        await this.updateUserSummaryOnStatusChange(vehicle.userId as Types.ObjectId, oldStatus, status);
      }

      return updated;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update vehicle status');
    }
  }

  private async updateUserSummaryOnCreate(userId: Types.ObjectId, vehicleType: string) {
    try {
      const updateData: any = {
        $inc: { totalListings: 1 },
      };

      if (vehicleType === VehicleType.BIKE) {
        updateData.$inc.bikePostCount = 1;
      } else if (vehicleType === VehicleType.CAR) {
        updateData.$inc.carPostCount = 1;
      }

      // Initial vehicle is PENDING and PENDING (payment)
      updateData.$inc.pendingCount = 1;

      await this.userSummaryModel.findOneAndUpdate(
        { userId },
        updateData,
        { upsert: true, new: true },
      );
    } catch (error) {
      console.error('Failed to update user summary on create:', error);
    }
  }

  async updateUserSummaryOnStatusChange(
    userId: Types.ObjectId,
    oldStatus: string,
    newStatus: string,
  ) {
    try {
      const updateData: any = { $inc: {} };

      // Decrement old status
      if (oldStatus === VehicleStatus.PENDING) {
        updateData.$inc.pendingCount = -1;
      } else if (oldStatus === VehicleStatus.ACTIVE) {
        updateData.$inc.activeCount = -1;
      } else if (oldStatus === VehicleStatus.SOLD) {
        updateData.$inc.soldCount = -1;
      } else if (oldStatus === VehicleStatus.REJECTED) {
        updateData.$inc.rejectedCount = -1;
      }

      // Increment new status
      if (newStatus === VehicleStatus.PENDING) {
        updateData.$inc.pendingCount = 1;
      } else if (newStatus === VehicleStatus.ACTIVE) {
        updateData.$inc.activeCount = 1;
      } else if (newStatus === VehicleStatus.SOLD) {
        updateData.$inc.soldCount = 1;
      } else if (newStatus === VehicleStatus.REJECTED) {
        updateData.$inc.rejectedCount = 1;
      }

      await this.userSummaryModel.findOneAndUpdate(
        { userId },
        updateData,
        { new: true },
      );
    } catch (error) {
      console.error('Failed to update user summary on status change:', error);
    }
  }

  async updateUserSummaryOnPaymentChange(
    userId: Types.ObjectId,
    oldPaymentStatus: string,
    newPaymentStatus: string,
  ) {
    try {
      const updateData: any = { $inc: {} };

      // Decrement old payment status
      if (oldPaymentStatus === PaymentStatus.PENDING) {
        updateData.$inc.pendingCount = -1;
      } else if (oldPaymentStatus === PaymentStatus.PAID) {
        updateData.$inc.paidCount = -1;
      }

      // Increment new payment status
      if (newPaymentStatus === PaymentStatus.PENDING) {
        updateData.$inc.pendingCount = 1;
      } else if (newPaymentStatus === PaymentStatus.PAID) {
        updateData.$inc.paidCount = 1;
      }

      await this.userSummaryModel.findOneAndUpdate(
        { userId },
        updateData,
        { new: true },
      );
    } catch (error) {
      console.error('Failed to update user summary on payment change:', error);
    }
  }

  async getAdminFilteredListings(
    filters: any,
    params: PaginationParams,
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const limit = this.paginationService.clampLimit(params.limit);
      const lastId = this.paginationService.decodeCursor(params.cursor);

      const query: any = {};

      // Apply filters only if provided
      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }

      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }

      if (filters.vehicleStatus || filters.status) {
        query.status = filters.vehicleStatus || filters.status;
      }

      if (lastId) {
        query._id = { $gt: lastId };
      }

      const items = await this.vehicleModel
        .find(query)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .populate('userId', 'name email phone');

      return this.paginationService.buildResponse(items as any, limit);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch admin filtered listings',
      );
    }
  }

}
