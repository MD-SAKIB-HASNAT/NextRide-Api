import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from 'src/vehicles/schemas/vehicle.schema';
import { PaginationService, PaginationParams, PaginatedResult } from 'src/common/services/pagination.service';
import { PaymentStatus, VehicleStatus } from 'src/common/enums/vehicle.enum';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    private paginationService: PaginationService,
  ) {}

  async getSellerProfile(sellerId: string, params: PaginationParams): Promise<PaginatedResult<Vehicle>> {
    try {
      const limit = this.paginationService.clampLimit(params.limit);
      const lastId = this.paginationService.decodeCursor(params.cursor);

      const query: any = {
        userId: new Types.ObjectId(sellerId),
        status: VehicleStatus.ACTIVE
      };

      if (lastId) {
        query._id = { $gt: lastId };
      }

      const items = await this.vehicleModel
        .find(query)
        .sort({ _id: 1 })
        .limit(limit + 1)
        .populate('userId', 'name phone email');

      return this.paginationService.buildResponse(items as any, limit);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch seller profile');
    }
  }
}
