import { Test, TestingModule } from '@nestjs/testing';
import { GpsService } from './gps.service';

describe('GpsService', () => {
  let service: GpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GpsService],
    }).compile();

    service = module.get<GpsService>(GpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
