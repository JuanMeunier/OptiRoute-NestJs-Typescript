// src/chat-socket/dto/create-chat-socket.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class SendMessageDto {
    @IsNumber()
    requestId: number;

    @IsString()
    message: string;
}

export class AcceptRequestDto {
    @IsNumber()
    requestId: number;
}