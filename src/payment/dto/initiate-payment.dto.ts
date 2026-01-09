import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class InitiatePaymentDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @IsString()
  product_category?: string;

  @IsOptional()
  @IsString()
  product_profile?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsString()
  @IsNotEmpty()
  cus_name: string;

  @IsEmail()
  @IsNotEmpty()
  cus_email: string;

  @IsString()
  @IsNotEmpty()
  cus_phone: string;

  @IsOptional()
  @IsString()
  cus_add1?: string;

  @IsOptional()
  @IsString()
  cus_city?: string;

  @IsOptional()
  @IsString()
  cus_country?: string;
}
