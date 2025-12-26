import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TempOtp extends Document {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ type: Date, index: { expires: 0 } })
  expiresAt: Date;
}

export const TempOtpSchema = SchemaFactory.createForClass(TempOtp);