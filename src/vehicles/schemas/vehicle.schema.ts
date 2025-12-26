import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VehicleType, FuelType, VehicleCondition, VehicleStatus, VehicleAvailability, PaymentStatus } from 'src/common/enums/vehicle.enum';

@Schema({ timestamps: true })
export class Vehicle extends Document {
  @Prop({ required: true, enum: Object.values(VehicleType) })
  vehicleType: VehicleType;

  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  modelName: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  mileage: number;

  @Prop({ required: true, enum: Object.values(FuelType) })
  fuelType: FuelType;

  @Prop({ required: true, enum: Object.values(VehicleCondition) })
  condition: VehicleCondition;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, default: null })
  location: string | null;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: String, default: null })
  video: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: Object.values(VehicleStatus), default: VehicleStatus.PENDING })
  status: VehicleStatus;

  @Prop({ enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
