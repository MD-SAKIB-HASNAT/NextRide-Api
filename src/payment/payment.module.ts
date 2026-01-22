import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AdminPaymentController } from './admin-payment.controller';
import { AdminPaymentService } from './admin-payment.service';
import { Vehicle, VehicleSchema } from '../vehicles/schemas/vehicle.schema';
import { PaymentTransaction, PaymentTransactionSchema } from './schemas/payment-transaction.schema';
import { PaginationService } from 'src/common/services/pagination.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    AuthModule,
  ],
  controllers: [PaymentController, AdminPaymentController],
  providers: [PaymentService, AdminPaymentService, PaginationService],
})
export class PaymentModule {}
