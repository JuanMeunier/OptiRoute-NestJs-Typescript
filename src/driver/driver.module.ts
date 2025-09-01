import { Module } from '@nestjs/common';
import { DriverService } from './services/driver.service';
import { DriverController } from './controllers/driver.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver]), AuthModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule { }
