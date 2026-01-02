import { IsEnum, IsOptional } from 'class-validator';
import { VehicleType } from 'src/common/enums/vehicle.enum';

export enum UpdateRequestStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in-review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class UpdateRequestFilterDto {
  @IsOptional()
  @IsEnum(UpdateRequestStatus)
  status?: UpdateRequestStatus;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;
}
