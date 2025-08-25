import { Module } from '@nestjs/common';
import { GpsService } from './services/gps.service';
import { GpsController } from './controllers/gps.controller';

@Module({
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule { }
