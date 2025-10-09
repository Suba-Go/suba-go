import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketService } from '../services/websocket.service';

interface WebSocketBidData {
  auctionItem?: {
    auction?: { id: string };
    item?: {
      id: string;
      name: string;
      plate?: string;
    };
  };
  auction?: { id: string };
  id: string;
  offered_price: number;
  bid_time: string;
  auctionItemId: string;
  user?: {
    id: string;
    public_name?: string;
  };
  item?: {
    id: string;
    name: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  },
  namespace: '/auctions',
})
export class AuctionWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionWebSocketGateway.name);

  constructor(private readonly websocketService: WebSocketService) {}

  afterInit() {
    this.websocketService.setServer(this.server);
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Extract user info from query parameters or headers
      const userId = client.handshake.query.userId as string;
      const tenantId = client.handshake.query.tenantId as string;

      if (!userId || !tenantId) {
        this.logger.warn(`Connection rejected: Missing userId or tenantId`);
        client.disconnect();
        return;
      }

      // TODO: Validate JWT token
      // const user = await this.authService.validateToken(token);
      // if (!user) {
      //   client.disconnect();
      //   return;
      // }

      // Add client to connected clients
      this.websocketService.addClient(client.id, {
        socket: client,
        userId,
        tenantId,
      });

      // Join tenant room for general notifications
      this.websocketService.joinTenantRoom(client.id, tenantId);

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Conectado exitosamente al sistema de subastas',
        clientId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connectedClient = this.websocketService.getClient(client.id);

    if (connectedClient) {
      // Leave all rooms
      if (connectedClient.auctionId) {
        this.websocketService.leaveAuctionRoom(
          client.id,
          connectedClient.auctionId
        );
      }
      this.websocketService.leaveTenantRoom(
        client.id,
        connectedClient.tenantId
      );

      this.logger.log(
        `Client disconnected: ${client.id} (User: ${connectedClient.userId})`
      );
    }

    // Remove client from connected clients
    this.websocketService.removeClient(client.id);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string }
  ) {
    const connectedClient = this.websocketService.getClient(client.id);

    if (!connectedClient) {
      client.emit('error', { message: 'Cliente no autenticado' });
      return;
    }

    const { auctionId } = data;

    if (!auctionId) {
      client.emit('error', { message: 'ID de subasta requerido' });
      return;
    }

    // Validate access to auction
    if (!this.websocketService.validateAuctionAccess()) {
      client.emit('error', { message: 'Sin acceso a esta subasta' });
      return;
    }

    // Leave previous auction room if any
    if (connectedClient.auctionId) {
      this.websocketService.leaveAuctionRoom(
        client.id,
        connectedClient.auctionId
      );
    }

    // Join new auction room
    this.websocketService.joinAuctionRoom(client.id, auctionId);

    this.logger.log(`Client ${client.id} joined auction ${auctionId}`);

    // Send confirmation
    client.emit('auctionJoined', {
      auctionId,
      participantCount:
        this.websocketService.getAuctionParticipantCount(auctionId),
    });

    // Notify other participants about new participant
    this.websocketService.emitParticipantCount(
      auctionId,
      this.websocketService.getAuctionParticipantCount(auctionId)
    );
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string }
  ) {
    const connectedClient = this.websocketService.getClient(client.id);

    if (!connectedClient) {
      return;
    }

    const { auctionId } = data;

    if (auctionId && connectedClient.auctionId === auctionId) {
      this.websocketService.leaveAuctionRoom(client.id, auctionId);

      this.logger.log(`Client ${client.id} left auction ${auctionId}`);

      // Send confirmation
      client.emit('auctionLeft', { auctionId });

      // Notify other participants about participant leaving
      this.websocketService.emitParticipantCount(
        auctionId,
        this.websocketService.getAuctionParticipantCount(auctionId)
      );
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('getAuctionStatus')
  handleGetAuctionStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string }
  ) {
    const connectedClient = this.websocketService.getClient(client.id);

    if (!connectedClient) {
      client.emit('error', { message: 'Cliente no autenticado' });
      return;
    }

    const { auctionId } = data;

    // TODO: Get auction status from database and send to client
    // const auction = await this.auctionService.getAuctionById(auctionId);
    // client.emit('auctionStatus', auction);

    client.emit('auctionStatus', {
      auctionId,
      status: 'ACTIVE', // Placeholder
      participantCount:
        this.websocketService.getAuctionParticipantCount(auctionId),
    });
  }

  // Method to be called from other services to emit events
  emitBidUpdate(bid: unknown) {
    this.websocketService.emitBidUpdate(bid as WebSocketBidData);
  }

  emitAuctionUpdate(auction: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.websocketService.emitAuctionStatusUpdate(auction as any);
  }
}
