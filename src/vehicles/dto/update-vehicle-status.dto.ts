import { IsEnum } from 'class-validator';
import { VehicleStatus } from 'src/common/enums/vehicle.enum';

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus, { message: 'status must be one of: pending, active, sold, rejected' })
  status: VehicleStatus;
}
