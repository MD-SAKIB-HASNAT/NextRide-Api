import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaymentStatus, VehicleStatus } from 'src/common/enums/vehicle.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PaginationService, PaginationParams, PaginatedResult } from 'src/common/services/pagination.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
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
      
      const vehicle = new this.vehicleModel({
        ...createVehicleDto,
        images: imagePaths,
        video: videoPaths[0] || null,
        userId: new Types.ObjectId(userId),
        status: VehicleStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });

      return await vehicle.save();
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to create vehicle listing',
      );
    }
  }

}
