import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from 'src/common/enums/user.enum';

export class FilterUserDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
