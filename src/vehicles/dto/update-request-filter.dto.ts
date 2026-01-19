import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { VehicleType } from 'src/common/enums/vehicle.enum';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
