import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { PaginationService } from 'src/common/services/pagination.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
    ]),
    AuthModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, FileUploadService, PaginationService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
