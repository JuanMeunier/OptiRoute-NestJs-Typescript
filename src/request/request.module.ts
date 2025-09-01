import { Module } from '@nestjs/common';
import { RequestService } from './services/request.service';
import { RequestController } from './controllers/request.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { ChatSocketModule } from 'src/chat-socket/chat-socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), AuthModule, ChatSocketModule],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule { }
