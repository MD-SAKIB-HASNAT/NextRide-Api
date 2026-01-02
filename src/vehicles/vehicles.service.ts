import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { UpdateRequest } from './schemas/update-request.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaymentStatus, VehicleStatus, VehicleType } from 'src/common/enums/vehicle.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PaginationService, PaginationParams, PaginatedResult } from 'src/common/services/pagination.service';
import { UserSummary } from 'src/user/schemas/user-summary.schema';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { SystemSetting } from 'src/Admin/settings/schemas/system-setting.schema';
import { UserRole } from 'src/common/enums/user.enum';
import { UpdateRequestFilterDto } from './dto/update-request-filter.dto';
import e from 'express';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(UserSummary.name) private userSummaryModel: Model<UserSummary>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequest>,
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
      const platformFeeRate = systemSetting?.[0]?.platformFeeRate ?? 0;
      const platformFee = Math.floor(Number(createVehicleDto.price) * platformFeeRate);
      
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

  async getPublicVehiclesFiltered(
    filters: VehicleFilterDto,
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

  async getVehiclesFiltered(
    user: any,
    filters: VehicleFilterDto,
    params: PaginationParams,
  ): Promise<PaginatedResult<Vehicle>> {
    try {
      const limit = this.paginationService.clampLimit(params.limit);
      const lastId = this.paginationService.decodeCursor(params.cursor);
      const query: any = user.role === UserRole.ADMIN ? {} : { userId: new Types.ObjectId(user.userId) };

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
        .populate('userId', 'name phone email role status profilePhoto emailVerified createdAt');

      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch vehicle details');
    }
  }

  async deleteVehicle(vehicleId: string, user: any) {
    try {
      const vehicle = await this.vehicleModel.findById(vehicleId);
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }
      const userRole = (user.role || user.userRole || '').toLowerCase();
      const isOwner = String(vehicle.userId) === String(user.userId);
      const isAdmin = userRole === 'admin';
      if (!isOwner && !isAdmin) {
        throw new BadRequestException('Not authorized to delete this listing');
      }

      //delete form update request table 
      await this.updateRequestModel.deleteMany({ vehicleId: vehicle._id });

      // Delete files
      if (vehicle.images?.length) {
        this.fileUploadService.deleteFiles(vehicle.images);
      }
      if (vehicle.video) {
        this.fileUploadService.deleteFile(vehicle.video);
      }

      // Adjust summary
      await this.updateUserSummaryOnDelete(
        vehicle.userId as Types.ObjectId,
        vehicle.vehicleType,
        vehicle.status,
      );

      await vehicle.deleteOne();
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete vehicle');
    }
  }

  private async updateUserSummaryOnDelete(
    userId: Types.ObjectId,
    vehicleType: string,
    status: string,
  ) {
    try {
      const inc: any = { totalListings: -1 };
      if (vehicleType === VehicleType.BIKE) inc.bikePostCount = -1;
      else if (vehicleType === VehicleType.CAR) inc.carPostCount = -1;

      if (status === VehicleStatus.PENDING) inc.pendingCount = (inc.pendingCount || 0) - 1;
      if (status === VehicleStatus.ACTIVE) inc.activeCount = (inc.activeCount || 0) - 1;
      if (status === VehicleStatus.SOLD) inc.soldCount = (inc.soldCount || 0) - 1;
      if (status === VehicleStatus.REJECTED) inc.rejectedCount = (inc.rejectedCount || 0) - 1;

      await this.userSummaryModel.findOneAndUpdate(
        { userId },
        { $inc: inc },
        { new: true },
      );
    } catch (err) {
      console.error('Failed to update summary on delete:', err);
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
      if(status === VehicleStatus.ACTIVE){
        vehicle.paymentStatus = PaymentStatus.PAID;
      }
      if(status === VehicleStatus.SOLD){
        vehicle.paymentStatus = PaymentStatus.PAID;
      }
      if(status === VehicleStatus.REJECTED){
        vehicle.paymentStatus = PaymentStatus.PENDING;
      }

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

  async createUpdateRequest(
    vehicleId: string,
    userId: string,
    updateData: any,
    images: any[],
    video?: any,
  ) {
    try {
      const vehicle = await this.vehicleModel.findById(vehicleId);
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }
      if (String(vehicle.userId) !== String(userId)) {
        throw new BadRequestException('Not authorized');
      }

      // Upload new images and video
      const imagePaths = images.length ? await this.fileUploadService.uploadFiles(images, 'vehicles/images') : vehicle.images;
      const videoPaths = video ? await this.fileUploadService.uploadFiles([video], 'vehicles/videos') : [vehicle.video];

      // Delete old files if new ones are provided
      if (images.length && vehicle.images?.length) {
        this.fileUploadService.deleteFiles(vehicle.images);
      }
      if (video && vehicle.video) {
        this.fileUploadService.deleteFile(vehicle.video);
      }

      // Update vehicle with new data directly
      vehicle.make = updateData.make;
      vehicle.modelName = updateData.modelName;
      vehicle.year = Number(updateData.year);
      vehicle.price = Number(updateData.price);
      vehicle.mileage = Number(updateData.mileage);
      vehicle.fuelType = updateData.fuelType;
      vehicle.condition = updateData.condition;
      vehicle.description = updateData.description;
      vehicle.location = updateData.location;
      vehicle.phone = updateData.phone;
      vehicle.images = imagePaths;
      vehicle.video = videoPaths[0] || null;
      vehicle.status = VehicleStatus.PENDING; 
      
      // Recalculate platformFee
      const systemSetting = await this.settingsModel.find();
      const platformFeeRate = systemSetting?.[0]?.platformFeeRate ?? 0;
      vehicle.platformFee = Math.floor(Number(vehicle.price) * platformFeeRate);
      
      await vehicle.save();

      // Create UpdateRequest record for approval workflow
      const updateRequest = new this.updateRequestModel({
        vehicleId: new Types.ObjectId(vehicleId),
        userId: new Types.ObjectId(userId),
        status: 'in-review',
      });

      return await updateRequest.save();
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create update request');
    }
  }

  async handleUpdateRequest(updateRequestId: string, action: string, adminId: string, note?: string) {
    try {
      const updateRequest = await this.updateRequestModel.findById(updateRequestId);
      if (!updateRequest) {
        throw new BadRequestException('Update request not found');
      }

      const vehicle = await this.vehicleModel.findById(updateRequest.vehicleId);
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }

      if (action === 'approve') {
        // Approve: set vehicle status back to active
        vehicle.status = VehicleStatus.ACTIVE;
        await vehicle.save();

        updateRequest.status = 'approved';
        updateRequest.updatedBy = new Types.ObjectId(adminId);
        await updateRequest.save();

        return { success: true, message: 'Update approved', vehicle };
      } else if (action === 'reject') {
        // Reject: set vehicle status back to active, store note
        vehicle.status = VehicleStatus.ACTIVE;
        await vehicle.save();

        updateRequest.status = 'rejected';
        updateRequest.updatedBy = new Types.ObjectId(adminId);
        updateRequest.note = note || null;
        await updateRequest.save();

        return { success: true, message: 'Update rejected' };
      } else {
        throw new BadRequestException('Invalid action. Use "approve" or "reject"');
      }
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to handle update request');
    }
  }

  async getAllUpdateRequestsList(
    params: PaginationParams,
    user: any,
    filters?: UpdateRequestFilterDto,
  ): Promise<PaginatedResult<UpdateRequest>> {
    try {
      const limit = this.paginationService.clampLimit(params.limit);
      const lastId = this.paginationService.decodeCursor(params.cursor);

      const match: any = {};

      if (user?.role === UserRole.USER) {
        const userId = user?.userId || user?.id;
        if (!userId) {
          throw new BadRequestException('User not authenticated');
        }
        match.userId = new Types.ObjectId(userId);
      }

      if (filters?.status) {
        match.status = filters.status;
      }

      if (lastId) {
        match._id = { $gt: lastId };
      }

      const pipeline: any[] = [
        { $match: match },
        { $sort: { _id: 1 } },
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicleId',
          },
        },
        { $unwind: '$vehicleId' },
      ];

      if (filters?.vehicleType) {
        pipeline.push({ $match: { 'vehicleId.vehicleType': filters.vehicleType } });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId',
            pipeline: [
              { $project: { name: 1, email: 1, role: 1 } },
            ],
          },
        },
        { $unwind: '$userId' },
        { $limit: limit + 1 },
      );

      const items = await this.updateRequestModel.aggregate(pipeline);

      return this.paginationService.buildResponse(items as any, limit);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch update requests');
    }
  }

}
