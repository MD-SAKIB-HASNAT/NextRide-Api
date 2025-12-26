import { IsEnum, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType, FuelType, VehicleCondition } from 'src/common/enums/vehicle.enum';

export class CreateVehicleDto {
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsString()
  make: string;

  @IsString()
  modelName: string;

  @Type(() => Number)
  @IsNumber()
  year: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsNumber()
  mileage: number;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  phone: string;

  @IsArray()
  @IsOptional()
  images?: any[];

  @IsOptional()
  video?: any;
}
