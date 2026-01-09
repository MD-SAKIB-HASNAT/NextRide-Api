import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
