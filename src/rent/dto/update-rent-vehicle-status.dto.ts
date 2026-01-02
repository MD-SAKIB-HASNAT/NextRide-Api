import { IsEnum } from 'class-validator';

export class UpdateRentVehicleStatusDto {
  @IsEnum(['pending', 'approved', 'rejected'])
  status: string;
}
