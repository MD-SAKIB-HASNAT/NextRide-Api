import axios from 'axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { Vehicle } from '../vehicles/schemas/vehicle.schema';
import { PaymentStatus, VehicleStatus } from '../common/enums/vehicle.enum';
import { PaymentTransaction } from './schemas/payment-transaction.schema';
import { PaymentStatus as TransactionStatus } from './schemas/payment-transaction.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
    @InjectModel(PaymentTransaction.name) private paymentTransactionModel: Model<PaymentTransaction>,
  ) {}

  async initiatePayment(payload: InitiatePaymentDto) {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3003';
    const tranId = `${payload.referenceId}TXN_${Date.now()}`;
    
    const data = {
      store_id: process.env.SSL_STORE_ID,
      store_passwd: process.env.SSL_STORE_PASSWORD,
      total_amount: payload.amount,
      currency: payload.currency || 'BDT',
      tran_id: tranId,
      success_url: `${backendBaseUrl}/payment/success`,
      fail_url: `${backendBaseUrl}/payment/fail`,
      cancel_url: `${backendBaseUrl}/payment/cancel`,
      ipn_url: `${backendBaseUrl}/payment/ipn`,
      shipping_method: 'NO',
      product_name: payload.product_name || 'Product',
      product_category: payload.product_category || 'General',
      product_profile: payload.product_profile || 'general',
      cus_name: payload.cus_name,
      cus_email: payload.cus_email,
      cus_add1: payload.cus_add1 || 'Dhaka',
      cus_city: payload.cus_city || 'Dhaka',
      cus_country: payload.cus_country || 'Bangladesh',
      cus_phone: payload.cus_phone,
    };

    // Convert to URLSearchParams for proper form encoding
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await axios.post(
      'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Store payment transaction in database
    const vehicle = await this.vehicleModel.findById(payload.referenceId).populate('userId');
    if (vehicle) {
      await this.paymentTransactionModel.create({
        tran_id: tranId,
        vehicleId: new Types.ObjectId(payload.referenceId),
        userId: vehicle.userId,
        amount: payload.amount,
        currency: payload.currency || 'BDT',
        status: TransactionStatus.INITIATED,
        product_name: payload.product_name,
        product_category: payload.product_category,
        cus_name: payload.cus_name,
        cus_email: payload.cus_email,
        cus_phone: payload.cus_phone,
        gatewayPageURL: response.data?.GatewayPageURL || response.data?.redirectGatewayURL || null,
        sessionkey: response.data?.sessionkey || null,
        gatewayResponse: response.data,
        initiatedAt: new Date(),
      });
    }

    return response.data;
  }

  private extractVehicleIdFromTranId(tranId: string): string {
    const marker = 'TXN_';
    const idx = tranId.indexOf(marker);
    if (idx > 0) return tranId.substring(0, idx);
    return tranId;
  }

  async markPaymentSuccess(tranId: string, amount?: number) {
    try {
      const vehicleId = this.extractVehicleIdFromTranId(tranId);
      const vehicle = await this.vehicleModel.findById(vehicleId);
      if (!vehicle) throw new BadRequestException('Vehicle not found');

      vehicle.paymentStatus = PaymentStatus.PAID;
      await vehicle.save();

      // Update payment transaction record
      await this.paymentTransactionModel.findOneAndUpdate(
        { tran_id: tranId },
        {
          status: TransactionStatus.SUCCESS,
          completedAt: new Date(),
          $set: { 'gatewayResponse.status': 'SUCCESS' },
        },
      );

      return { success: true, vehicle };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to mark payment success');
    }
  }

  async markPaymentFailed(tranId: string) {
    try {
      const vehicleId = this.extractVehicleIdFromTranId(tranId);
      const vehicle = await this.vehicleModel.findById(vehicleId);
      if (!vehicle) throw new BadRequestException('Vehicle not found');

      vehicle.paymentStatus = PaymentStatus.PENDING;
      await vehicle.save();

      // Update payment transaction record
      await this.paymentTransactionModel.findOneAndUpdate(
        { tran_id: tranId },
        {
          status: TransactionStatus.FAILED,
          completedAt: new Date(),
        },
      );

      return { success: true, vehicle };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to mark payment failed');
    }
  }

  async markPaymentCancelled(tranId: string) {
    try {
      const vehicleId = this.extractVehicleIdFromTranId(tranId);
      const vehicle = await this.vehicleModel.findById(vehicleId);
      if (vehicle) {
        vehicle.paymentStatus = PaymentStatus.PENDING;
        await vehicle.save();
      }

      // Update payment transaction record
      await this.paymentTransactionModel.findOneAndUpdate(
        { tran_id: tranId },
        {
          status: TransactionStatus.CANCELLED,
          completedAt: new Date(),
        },
      );

      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to mark payment cancelled');
    }
  }

  
}
