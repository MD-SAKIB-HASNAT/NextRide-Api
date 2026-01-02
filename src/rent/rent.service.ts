import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RentVehicle } from './schemas/rent-vehicle.schema';
import { CreateRentVehicleDto } from './dto/create-rent-vehicle.dto';
import { FilterRentVehicleDto } from './dto/filter-rent-vehicle.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Injectable()
export class RentService {
  constructor(
    @InjectModel(RentVehicle.name) private rentVehicleModel: Model<RentVehicle>,
    private paginationService: PaginationService,
    private fileUploadService: FileUploadService,
  ) {}

  async createRentVehicle(
    createDto: CreateRentVehicleDto,
    ownerId: string,
    images?: Express.Multer.File[],
  ) {
    try {
      const imagePaths = images && images.length > 0
        ? await this.fileUploadService.uploadFiles(images, 'rent-vehicles')
        : [];

      const rentVehicle = new this.rentVehicleModel({
        ...createDto,
        ownerId: new Types.ObjectId(ownerId),
        images: imagePaths,
        status: 'pending',
        availability: 'available',
      });

      return await rentVehicle.save();
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create rent vehicle');
    }
  }

  async listRentVehicles(filters: FilterRentVehicleDto, includeAllStatuses = false) {
    try {
      const query: any = {};

      // Public listings show only approved by default; admins can request all
      if (!filters.status && !includeAllStatuses) {
        query.status = 'approved';
      } else if (filters.status) {
        query.status = filters.status;
      }

      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }

      if (filters.availability) {
        query.availability = filters.availability;
      }

      if (filters.search) {
        const regex = new RegExp(filters.search, 'i');
        query.$or = [
          { vehicleModel: regex },
          { address: regex },
          { description: regex },
        ];
      }

      const limit = this.paginationService.clampLimit(filters.limit);
      const lastId = this.paginationService.decodeCursor(filters.cursor);

      if (lastId) {
        query._id = { $gt: lastId };
      }

      const items = await this.rentVehicleModel
        .find(query)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .populate('ownerId', 'name email phone');

      const result = this.paginationService.buildResponse(items as any, limit);
      return {
        data: result.data,
        pageInfo: result.pageInfo,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to list rent vehicles');
    }
  }

  async getMyRentVehicles(ownerId: string, filters: FilterRentVehicleDto) {
    try {
      const query: any = { ownerId: new Types.ObjectId(ownerId) };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.vehicleType) {
        query.vehicleType = filters.vehicleType;
      }

      if (filters.availability) {
        query.availability = filters.availability;
      }

      const limit = this.paginationService.clampLimit(filters.limit);
      const lastId = this.paginationService.decodeCursor(filters.cursor);

      if (lastId) {
        query._id = { $gt: lastId };
      }

      const items = await this.rentVehicleModel
        .find(query)
        .sort({ _id: 1 })
        .limit(limit + 1);

      const result = this.paginationService.buildResponse(items as any, limit);
      return {
        data: result.data,
        pageInfo: result.pageInfo,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch your rent vehicles');
    }
  }

  async getRentVehicleById(id: string) {
    try {
      const vehicle = await this.rentVehicleModel
        .findById(id)
        .populate('ownerId', 'name email phone');

      if (!vehicle) {
        throw new NotFoundException('Rent vehicle not found');
      }

      return vehicle;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch rent vehicle');
    }
  }

  async updateRentVehicleStatus(id: string, status: string, adminId?: string) {
    try {
      const vehicle = await this.rentVehicleModel.findById(id);
      if (!vehicle) {
        throw new NotFoundException('Rent vehicle not found');
      }

      vehicle.status = status as any;
      await vehicle.save();

      return {
        message: 'Rent vehicle status updated successfully',
        vehicle,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update status');
    }
  }

  async deleteRentVehicle(id: string, userId: string) {
    try {
      const vehicle = await this.rentVehicleModel.findById(id);
      if (!vehicle) {
        throw new NotFoundException('Rent vehicle not found');
      }

      if (vehicle.ownerId.toString() !== userId) {
        throw new ForbiddenException('You can only delete your own listings');
      }

      // Delete associated images
      if (vehicle.images && vehicle.images.length > 0) {
        for (const image of vehicle.images) {
          await this.fileUploadService.deleteFile(image);
        }
      }

      await this.rentVehicleModel.findByIdAndDelete(id);

      return { message: 'Rent vehicle deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete rent vehicle');
    }
  }
}
