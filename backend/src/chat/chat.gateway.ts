import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ namespace: '/chat', cors: { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] } })
export class ChatGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('chat:message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; content: string },
  ) {
    this.server.to(`chat:${data.sessionId}`).emit('chat:message_new', {
      sessionId: data.sessionId,
      senderType: client.data?.user?.role ?? 'customer',
      senderId: client.data?.user?.sub,
      content: data.content,
      timestamp: new Date().toISOString(),
    })
  }

  @SubscribeMessage('chat:subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: string }) {
    client.join(`chat:${data.sessionId}`)
  }
}
