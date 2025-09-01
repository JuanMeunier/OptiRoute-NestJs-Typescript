import { Module } from '@nestjs/common';
import { GpsService } from './services/gps.service';
import { GpsController } from './controllers/gps.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GPS } from './entities/gps.entity';
@Module({
  imports: [TypeOrmModule.forFeature([GPS]), AuthModule],
  controllers: [GpsController],
  providers: [GpsService],
})
export class GpsModule { }
