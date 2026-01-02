import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from 'src/common/enums/user.enum';

export class FilterOrganizationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // Pagination fields (cursor style)
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
