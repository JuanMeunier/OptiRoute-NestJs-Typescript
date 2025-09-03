// src/chat-socket/chat-socket.module.ts
import { Module } from '@nestjs/common';
import { ChatSocketGateway } from './chat-socket.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Importar AuthModule para JWT
  providers: [ChatSocketGateway],
  exports: [ChatSocketGateway],
})
export class ChatSocketModule { }