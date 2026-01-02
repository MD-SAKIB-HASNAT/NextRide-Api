import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationController } from './organization.controller';
import { PublicOrganizationController } from './public-organization.controller';
import { OrganizationService } from './organization.service';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { PaginationService } from 'src/common/services/pagination.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [OrganizationController, PublicOrganizationController],
  providers: [OrganizationService, PaginationService],
})
export class OrganizationModule {}
