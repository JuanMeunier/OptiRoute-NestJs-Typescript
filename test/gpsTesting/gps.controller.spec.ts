import { Test, TestingModule } from '@nestjs/testing';
import { GpsController } from 'src/gps/controllers/gps.controller';
import { GpsService } from 'src/gps/services/gps.service';

describe('GpsController', () => {
  let controller: GpsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsController],
      providers: [GpsService],
    }).compile();

    controller = module.get<GpsController>(GpsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
