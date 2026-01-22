import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from 'src/vehicles/schemas/vehicle.schema';
import { UpdateRequest } from 'src/vehicles/schemas/update-request.schema';
import { UserSummary } from 'src/user/schemas/user-summary.schema';
import { VehicleStatus } from 'src/common/enums/vehicle.enum';
import {
  PaymentTransaction,
  PaymentStatus as TransactionStatus,
} from 'src/payment/schemas/payment-transaction.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(UserSummary.name) private userSummaryModel: Model<UserSummary>,
    @InjectModel(UpdateRequest.name) private updateRequestModel: Model<UpdateRequest>,
    @InjectModel(PaymentTransaction.name)
    private paymentTransactionModel: Model<PaymentTransaction>,
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

  async getAnalytics() {
    const now = new Date();
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: monthLabels[date.getMonth()],
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    });

    const startDate = new Date(months[0].year, months[0].month - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalVehicles,
      activeListings,
      totalUsers,
      revenueAgg,
      salesAgg,
      userAgg,
    ] = await Promise.all([
      this.vehicleModel.countDocuments(),
      this.vehicleModel.countDocuments({ status: VehicleStatus.ACTIVE }),
      this.userSummaryModel.countDocuments(),
      this.paymentTransactionModel.aggregate([
        { $match: { status: TransactionStatus.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.paymentTransactionModel.aggregate([
        {
          $match: {
            status: TransactionStatus.SUCCESS,
            completedAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
            sales: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      this.userSummaryModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            users: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalRevenue = revenueAgg?.[0]?.total || 0;

    const salesMap = new Map<string, number>();
    salesAgg.forEach((item) => {
      salesMap.set(`${item._id.year}-${item._id.month}`, item.sales);
    });

    const userMap = new Map<string, number>();
    userAgg.forEach((item) => {
      userMap.set(`${item._id.year}-${item._id.month}`, item.users);
    });

    let cumulativeUsers = totalUsers - (userAgg.reduce((sum, item) => sum + item.users, 0) || 0);
    const userGrowthChart = months.map((m) => {
      const added = userMap.get(m.key) || 0;
      cumulativeUsers += added;
      return { month: m.label, users: cumulativeUsers };
    });

    const vehicleSalesChart = months.map((m) => ({
      month: m.label,
      sales: salesMap.get(m.key) || 0,
    }));

    const lastUsers = userGrowthChart[userGrowthChart.length - 1]?.users || 0;
    const prevUsers = userGrowthChart[userGrowthChart.length - 2]?.users || 0;
    const monthlyGrowth = prevUsers ? Number((((lastUsers - prevUsers) / prevUsers) * 100).toFixed(1)) : 0;

    return {
      totalRevenue,
      totalUsers,
      totalVehicles,
      activeListings,
      monthlyGrowth,
      vehicleSalesChart,
      userGrowthChart,
    };
  }
}
