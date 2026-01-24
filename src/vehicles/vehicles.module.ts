import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { UserSummary, UserSummarySchema } from 'src/user/schemas/user-summary.schema';
import { UpdateRequest, UpdateRequestSchema } from './schemas/update-request.schema';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { EmailService } from 'src/common/services/email.service';
import { PaginationService } from 'src/common/services/pagination.service';
import { AuthModule } from 'src/auth/auth.module';
import { SystemSetting, SystemSettingSchema } from 'src/Admin/settings/schemas/system-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: UserSummary.name, schema: UserSummarySchema },
      { name: UpdateRequest.name, schema: UpdateRequestSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema},
    ]),
    AuthModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, FileUploadService, PaginationService, EmailService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
