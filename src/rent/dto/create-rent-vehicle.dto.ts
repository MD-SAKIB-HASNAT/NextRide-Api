import { IsString, IsEnum, IsNumber, IsOptional, IsEmail, Min } from 'class-validator';

export class CreateRentVehicleDto {
  @IsString()
  vehicleModel: string;

  @IsEnum(['car', 'bike'])
  vehicleType: string;

  @IsString()
  address: string;

  @IsString()
  contactNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @IsOptional()
  @IsString()
  description?: string;
}
