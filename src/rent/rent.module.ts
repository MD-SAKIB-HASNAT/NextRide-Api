import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentController } from './rent.controller';
import { RentService } from './rent.service';
import { RentVehicle, RentVehicleSchema } from './schemas/rent-vehicle.schema';
import { UserSummary, UserSummarySchema } from 'src/user/schemas/user-summary.schema';
import { PaginationService } from 'src/common/services/pagination.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentVehicle.name, schema: RentVehicleSchema },
      { name: UserSummary.name, schema: UserSummarySchema },
    ]),
    AuthModule,
  ],
  controllers: [RentController],
  providers: [RentService, PaginationService, FileUploadService],
  exports: [RentService],
})
export class RentModule {}
