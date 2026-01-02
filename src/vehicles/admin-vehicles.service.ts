import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from './schemas/vehicle.schema';
import { UpdateRequest } from './schemas/update-request.schema';
import { UserSummary } from 'src/user/schemas/user-summary.schema';
import { VehicleStatus } from 'src/common/enums/vehicle.enum';

@Injectable()
export class AdminVehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(UserSummary.name) private userSummaryModel: Model<UserSummary>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequest>,
  ) {}

  async getOverview() {
    const [
      totalVehicles,
      activeCount,
      pendingCount,
      rejectedCount,
      soldCount,
      totalUsers,
      pendingUpdateRequests,
      feeAgg,
    ] = await Promise.all([
      this.vehicleModel.countDocuments(),
      this.vehicleModel.countDocuments({ status: VehicleStatus.ACTIVE }),
      this.vehicleModel.countDocuments({ status: VehicleStatus.PENDING }),
      this.vehicleModel.countDocuments({ status: VehicleStatus.REJECTED }),
      this.vehicleModel.countDocuments({ status: VehicleStatus.SOLD }),
      this.userSummaryModel.countDocuments(),
      this.updateRequestModel.countDocuments({ status: { $in: ['pending', 'in-review'] } }),
      this.vehicleModel.aggregate([
        { $match: { platformFee: { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } },
      ]),
    ]);

    const totalPlatformFee = feeAgg?.[0]?.total || 0;

    return {
      totalVehicles,
      activeCount,
      pendingCount,
      rejectedCount,
      soldCount,
      totalUsers,
      pendingUpdateRequests,
      totalPlatformFee,
    };
  }
}
