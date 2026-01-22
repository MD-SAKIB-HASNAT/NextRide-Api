import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentTransaction } from './schemas/payment-transaction.schema';
import { PaginationService, PaginationParams } from 'src/common/services/pagination.service';

interface PaymentFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdminPaymentService {
  constructor(
    @InjectModel(PaymentTransaction.name)
    private paymentTransactionModel: Model<PaymentTransaction>,
    private paginationService: PaginationService,
  ) {}

  async getAllPaymentHistory(params: PaginationParams, filters: PaymentFilters) {
    const limit = this.paginationService.clampLimit(params.limit);
    const lastId = this.paginationService.decodeCursor(params.cursor);

    const match: any = {};

    // Status filter
    if (filters.status) {
      match.status = filters.status;
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) {
        match.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        match.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Cursor pagination
    if (lastId) {
      match._id = { $gt: lastId };
    }

    const pipeline: any[] = [
      { $match: match },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tran_id: 1,
          amount: 1,
          currency: 1,
          status: 1,
          cus_name: 1,
          cus_email: 1,
          cus_phone: 1,
          product_name: 1,
          initiatedAt: 1,
          completedAt: 1,
          createdAt: 1,
          'user.name': 1,
          'user.email': 1,
          'user._id': 1,
          'vehicle.make': 1,
          'vehicle.modelName': 1,
          'vehicle.vehicleType': 1,
          'vehicle._id': 1,
        },
      },
      { $limit: limit + 1 },
    ];

    // Search filter (apply after lookup)
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      pipeline.splice(4, 0, {
        $match: {
          $or: [
            { tran_id: searchRegex },
            { cus_email: searchRegex },
            { cus_name: searchRegex },
            { 'user.name': searchRegex },
            { 'user.email': searchRegex },
          ],
        },
      });
    }

    const items = await this.paymentTransactionModel.aggregate(pipeline);

    return this.paginationService.buildResponse(items as any, limit);
  }
}
