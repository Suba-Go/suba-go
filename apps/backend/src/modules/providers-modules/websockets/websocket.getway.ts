/**
 * @file websocket.getway.ts
 * @description WebSocket gateway for the application
 * @author Suba&Go
 * @version 1.0.0
 * @since 1.0.0
 */
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class WebsocketGetway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
  }
  handleConnection(client: Socket) {
    console.log('Client connected', client.id);
  }
  @WebSocketServer()
  server: Server;
}
