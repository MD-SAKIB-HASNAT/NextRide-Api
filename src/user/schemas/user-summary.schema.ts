import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserSummary extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  bikePostCount: number;

  @Prop({ default: 0 })
  carPostCount: number;

  @Prop({ default: 0 })
  paidCount: number;

  @Prop({ default: 0 })
  pendingCount: number;

  @Prop({ default: 0 })
  activeCount: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ default: 0 })
  rejectedCount: number;

  @Prop({ default: 0 })
  totalListings: number;

  @Prop({ default: 0 })
  rentVehicleCount: number;
}

export const UserSummarySchema = SchemaFactory.createForClass(UserSummary);
