import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SystemSetting extends Document {
  @Prop({ type: String, default: 'NextRide' })
  siteName: string;

  @Prop({ type: Boolean, default: true })
  allowRegistration: boolean;

  @Prop({ type: Number, default: 0.05 })
  commissionRate: number; // e.g., 5%

  @Prop({ type: Number, default: 10 })
  maxListingsPerUser: number;

  @Prop({ type: String, default: 'support@nextride.com' })
  contactEmail: string;

  @Prop({ type: Boolean, default: false })
  maintenanceMode: boolean;

  @Prop({ type: String, default: '' })
  homeBannerText: string;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);
