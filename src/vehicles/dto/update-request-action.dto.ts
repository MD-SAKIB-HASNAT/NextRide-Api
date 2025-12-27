import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UpdateRequestAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class UpdateRequestActionDto {
  @IsEnum(UpdateRequestAction)
  action: UpdateRequestAction;

  @IsOptional()
  @IsString()
  note?: string;
}
