import axios from 'axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { Vehicle } from '../vehicles/schemas/vehicle.schema';
import { PaymentStatus, VehicleStatus } from '../common/enums/vehicle.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<Vehicle>,
  ) {}

  async initiatePayment(payload: InitiatePaymentDto) {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || process.env.VITE_API_URL || 'http://localhost:3003';
    
    const data = {
      store_id: process.env.SSL_STORE_ID,
      store_passwd: process.env.SSL_STORE_PASSWORD,
      total_amount: payload.amount,
      currency: payload.currency || 'BDT',
      tran_id: `${payload.referenceId}TXN_${Date.now()}`,
      success_url: `${backendBaseUrl}/payment/success`,
      fail_url: `${backendBaseUrl}/payment/fail`,
      cancel_url: `${backendBaseUrl}/payment/cancel`,
      ipn_url: `${backendBaseUrl}/payment/ipn`,
      shipping_method: 'NO',
      product_name: payload.product_name,
      product_category: payload.product_category,
      cus_name: payload.cus_name,
      cus_email: payload.cus_email,
      cus_add1: payload.cus_add1,
      cus_city: payload.cus_city,
      cus_country: payload.cus_country,
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

      return { success: true, vehicle };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to mark payment failed');
    }
  }

  
}
