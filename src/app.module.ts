import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GpsModule } from './gps/gps.module';
import { DriverModule } from './driver/driver.module';
import { RequestModule } from './request/request.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService disponible globalmente
      envFilePath: '.env', // opcional si usás otro archivo
    }),
    UsersModule,
    AuthModule,
    DatabaseModule,
    VehiclesModule,
    GpsModule,
    DriverModule,
    RequestModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
