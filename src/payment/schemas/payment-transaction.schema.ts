import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class PaymentTransaction extends Document {
  @Prop({ required: true, unique: true })
  tran_id: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'BDT' })
  currency: string;

  @Prop({ enum: Object.values(PaymentStatus), default: PaymentStatus.INITIATED })
  status: PaymentStatus;

  @Prop({ type: String, default: null })
  product_name: string | null;

  @Prop({ type: String, default: null })
  product_category: string | null;

  @Prop({ type: String, default: null })
  cus_name: string | null;

  @Prop({ type: String, default: null })
  cus_email: string | null;

  @Prop({ type: String, default: null })
  cus_phone: string | null;

  @Prop({ type: String, default: null })
  gatewayPageURL: string | null;

  @Prop({ type: String, default: null })
  sessionkey: string | null;

  @Prop({ type: String, default: null })
  validation_id: string | null;

  @Prop({ type: Date, default: null })
  initiatedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Object, default: null })
  gatewayResponse: any;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
