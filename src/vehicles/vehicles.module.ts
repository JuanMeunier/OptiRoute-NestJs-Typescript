import { Module } from '@nestjs/common';
import { VehiclesService } from './services/vehicles.service';
import { VehiclesController } from './controllers/vehicles.controller';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule { }
