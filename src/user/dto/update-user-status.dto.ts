import { IsEnum } from 'class-validator';
import { UserStatus } from 'src/common/enums/user.enum';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
