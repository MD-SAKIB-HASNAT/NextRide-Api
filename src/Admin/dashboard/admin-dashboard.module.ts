import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { Vehicle, VehicleSchema } from 'src/vehicles/schemas/vehicle.schema';
import { UpdateRequest, UpdateRequestSchema } from 'src/vehicles/schemas/update-request.schema';
import { UserSummary, UserSummarySchema } from 'src/user/schemas/user-summary.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: UpdateRequest.name, schema: UpdateRequestSchema },
      { name: UserSummary.name, schema: UserSummarySchema },
    ]),
    AuthModule,
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
