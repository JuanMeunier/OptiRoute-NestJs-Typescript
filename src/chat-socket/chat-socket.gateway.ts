// src/chat-socket/chat-socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(ChatSocketGateway.name);
  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const user = this.jwtService.verify(token);
      client.data.user = user;

      // Mapear userId con socketId
      this.connectedUsers.set(user.userId, client.id);

      this.logger.log(`User ${user.userId} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.userId);
      this.logger.log(`User ${user.userId} disconnected`);
    }
  }

  // MÉTODO LLAMADO DESDE EL CONTROLLER cuando request pasa a "in_progress"
  async createChatForRequest(requestId: number, clientId: number, driverId: number) {
    const chatRoom = `chat-${requestId}`;

    // Obtener sockets de cliente y driver
    const clientSocketId = this.connectedUsers.get(clientId);
    const driverSocketId = this.connectedUsers.get(driverId);

    // Unir ambos al chat room
    if (clientSocketId) {
      const clientSocket = this.server.sockets.sockets.get(clientSocketId);
      if (clientSocket) {
        clientSocket.join(chatRoom);
        clientSocket.emit('chatCreated', {
          requestId,
          partnerId: driverId,
          partnerRole: 'driver',
          message: 'Chat creado con tu driver'
        });
      }
    }

    if (driverSocketId) {
      const driverSocket = this.server.sockets.sockets.get(driverSocketId);
      if (driverSocket) {
        driverSocket.join(chatRoom);
        driverSocket.emit('chatCreated', {
          requestId,
          partnerId: clientId,
          partnerRole: 'client',
          message: 'Chat creado con tu cliente'
        });
      }
    }

    this.logger.log(`Chat created for request ${requestId} between client ${clientId} and driver ${driverId}`);
  }

  // Enviar mensaje en el chat
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody() data: { requestId: number; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) return { error: 'No autenticado' };

    const chatRoom = `chat-${data.requestId}`;

    const messageData = {
      requestId: data.requestId,
      message: data.message,
      senderId: user.userId,
      senderRole: user.role,
      timestamp: new Date(),
    };

    // Enviar mensaje a todos en el chat room
    this.server.to(chatRoom).emit('newMessage', messageData);

    return { status: 'Mensaje enviado' };
  }

  // Opcional: obtener usuarios conectados
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}