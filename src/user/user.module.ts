import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserSummary, UserSummarySchema } from './schemas/user-summary.schema';
import { AuthModule } from 'src/auth/auth.module';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { EmailService } from 'src/common/services/email.service';
import { AdminUserController } from './admin-user.controller';
import { PaginationService } from 'src/common/services/pagination.service';
import { SystemSetting, SystemSettingSchema } from 'src/Admin/settings/schemas/system-setting.schema';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSummary.name, schema: UserSummarySchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
    ]),
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService, FileUploadService, EmailService, PaginationService],
  exports: [UserService],
})
export class UserModule {}

