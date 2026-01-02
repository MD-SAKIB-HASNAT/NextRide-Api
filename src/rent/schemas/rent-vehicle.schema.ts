import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RentVehicleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RentVehicleAvailability {
  AVAILABLE = 'available',
  RENTED = 'rented',
}

@Schema({ timestamps: true })
export class RentVehicle extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  vehicleModel: string;

  @Prop({ required: true, enum: ['car', 'bike'] })
  vehicleType: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  pricePerDay: number;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: RentVehicleStatus;

  @Prop({ required: true, enum: ['available', 'rented'], default: 'available' })
  availability: RentVehicleAvailability;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RentVehicleSchema = SchemaFactory.createForClass(RentVehicle);
