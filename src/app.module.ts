import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GpsModule } from './gps/gps.module';
import { DriverModule } from './driver/driver.module';
import { RequestModule } from './request/request.module';


@Module({
  imports: [UsersModule, VehiclesModule, GpsModule, DriverModule, RequestModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
