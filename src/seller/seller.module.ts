import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from 'src/vehicles/schemas/vehicle.schema';
import { PaginationService } from 'src/common/services/pagination.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [SellerController],
  providers: [SellerService, PaginationService],
})
export class SellerModule {}
