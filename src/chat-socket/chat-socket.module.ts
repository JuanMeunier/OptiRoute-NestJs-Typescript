// src/chat-socket/chat-socket.module.ts
import { Module } from '@nestjs/common';
import { ChatSocketGateway } from './chat-socket.gateway';
import { ChatSocketService } from './chat-socket.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Importar AuthModule para JWT
  providers: [ChatSocketGateway, ChatSocketService],
  exports: [ChatSocketGateway],
})
export class ChatSocketModule { }