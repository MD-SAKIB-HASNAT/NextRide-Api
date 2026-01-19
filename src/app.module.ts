import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SellerModule } from './seller/seller.module';
import { SettingsModule } from './Admin/settings/settings.module';
import { AdminDashboardModule } from './Admin/dashboard/admin-dashboard.module';
import { OrganizationModule } from './organization/organization.module';
import { RentModule } from './rent/rent.module';
import { PaymentModule } from './payment/payment.module';
import { AiModule } from './ai/ai.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/nextride'),
    UserModule,
    AuthModule,
    VehiclesModule,
    SellerModule,
    SettingsModule,
    AdminDashboardModule,
    OrganizationModule,
    RentModule,
    PaymentModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
