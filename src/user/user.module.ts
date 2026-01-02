import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserSummary, UserSummarySchema } from './schemas/user-summary.schema';
import { AuthModule } from 'src/auth/auth.module';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { AdminUserController } from './admin-user.controller';
import { PaginationService } from 'src/common/services/pagination.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSummary.name, schema: UserSummarySchema },
    ]),
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService, FileUploadService, PaginationService],
  exports: [UserService],
})
export class UserModule {}

