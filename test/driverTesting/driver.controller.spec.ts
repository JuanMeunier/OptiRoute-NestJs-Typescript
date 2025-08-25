import { Test, TestingModule } from '@nestjs/testing';
import { DriverController } from 'src/driver/controllers/driver.controller';
import { DriverService } from 'src/driver/services/driver.service';

describe('DriverController', () => {
  let controller: DriverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [DriverService],
    }).compile();

    controller = module.get<DriverController>(DriverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
