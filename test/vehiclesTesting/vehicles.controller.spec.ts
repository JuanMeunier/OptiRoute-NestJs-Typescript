import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from 'src/vehicles/controllers/vehicles.controller';
import { VehiclesService } from 'src/vehicles/services/vehicles.service';

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [VehiclesService],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
