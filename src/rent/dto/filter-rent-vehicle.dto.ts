import { IsOptional, IsEnum, IsString } from 'class-validator';

export class FilterRentVehicleDto {
  @IsOptional()
  @IsEnum(['car', 'bike'])
  vehicleType?: string;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  status?: string;

  @IsOptional()
  @IsEnum(['available', 'rented'])
  availability?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number;
}
