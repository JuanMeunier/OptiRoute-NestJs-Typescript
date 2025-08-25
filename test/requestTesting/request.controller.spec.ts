import { Test, TestingModule } from '@nestjs/testing';
import { RequestController } from 'src/request/controllers/request.controller';
import { RequestService } from 'src/request/services/request.service';

describe('RequestController', () => {
  let controller: RequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [RequestService],
    }).compile();

    controller = module.get<RequestController>(RequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
