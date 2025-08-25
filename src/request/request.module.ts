import { Module } from '@nestjs/common';
import { RequestService } from './services/request.service';
import { RequestController } from './controllers/request.controller';

@Module({
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule { }
