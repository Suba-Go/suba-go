import { Injectable } from '@nestjs/common';

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
import { Server, Socket } from 'socket.io';
import type { Auction } from '@prisma/client';

interface ConnectedClient {
  socket: Socket;
  userId: string;
  tenantId: string;
  auctionId?: string;
}

@Injectable()
export class WebSocketService {
  private server: Server;
  private connectedClients = new Map<string, ConnectedClient>();

  setServer(server: Server) {
    this.server = server;
  }

  addClient(socketId: string, client: ConnectedClient) {
    this.connectedClients.set(socketId, client);
  }

  removeClient(socketId: string) {
    this.connectedClients.delete(socketId);
  }

  getClient(socketId: string): ConnectedClient | undefined {
    return this.connectedClients.get(socketId);
  }

  joinAuctionRoom(socketId: string, auctionId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.auctionId = auctionId;
      client.socket.join(`auction:${auctionId}`);
    }
  }

  leaveAuctionRoom(socketId: string, auctionId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.auctionId = undefined;
      client.socket.leave(`auction:${auctionId}`);
    }
  }

  // Emit bid updates to all clients in the auction room
  emitBidUpdate(bid: WebSocketBidData) {
    if (!this.server) return;

    const auctionId = bid.auctionItem?.auction?.id || bid.auction?.id;
    if (!auctionId) return;

    this.server.to(`auction:${auctionId}`).emit('bidUpdate', {
      type: 'BID_PLACED',
      data: {
        id: bid.id,
        offeredPrice: Number(bid.offered_price),
        bidTime: bid.bid_time,
        auctionItemId: bid.auctionItemId,
        user: {
          id: bid.user?.id,
          publicName: bid.user?.public_name || 'Participante',
        },
        item: {
          id: bid.auctionItem?.item?.id,
          name: bid.auctionItem?.item?.name,
          plate: bid.auctionItem?.item?.plate,
        },
      },
    });
  }

  // Emit bid deletion to all clients in the auction room
  emitBidDelete(bidId: string, auctionId: string) {
    if (!this.server) return;

    this.server.to(`auction:${auctionId}`).emit('bidUpdate', {
      type: 'BID_DELETED',
      data: {
        bidId,
      },
    });
  }

  // Emit auction status updates
  emitAuctionStatusUpdate(auction: Auction) {
    if (!this.server) return;

    this.server.to(`auction:${auction.id}`).emit('auctionUpdate', {
      type: 'STATUS_CHANGED',
      data: {
        id: auction.id,
        status: auction.status,
        title: auction.title,
        startTime: auction.startTime,
        endTime: auction.endTime,
      },
    });
  }

  // Emit auction timer updates
  emitAuctionTimer(auctionId: string, timeRemaining: number) {
    if (!this.server) return;

    this.server.to(`auction:${auctionId}`).emit('auctionTimer', {
      auctionId,
      timeRemaining,
    });
  }

  // Emit participant count updates
  emitParticipantCount(auctionId: string, count: number) {
    if (!this.server) return;

    this.server.to(`auction:${auctionId}`).emit('participantCount', {
      auctionId,
      count,
    });
  }

  // Get connected clients count for an auction
  getAuctionParticipantCount(auctionId: string): number {
    if (!this.server) return 0;

    const room = this.server.sockets.adapter.rooms.get(`auction:${auctionId}`);
    return room ? room.size : 0;
  }

  // Broadcast to all clients in a tenant
  emitToTenant(tenantId: string, event: string, data: unknown) {
    if (!this.server) return;

    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  // Join tenant room for general notifications
  joinTenantRoom(socketId: string, tenantId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.socket.join(`tenant:${tenantId}`);
    }
  }

  // Leave tenant room
  leaveTenantRoom(socketId: string, tenantId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.socket.leave(`tenant:${tenantId}`);
    }
  }

  // Send notification to specific user
  emitToUser(userId: string, event: string, data: unknown) {
    if (!this.server) return;

    // Find all sockets for this user
    for (const [, client] of this.connectedClients.entries()) {
      if (client.userId === userId) {
        client.socket.emit(event, data);
      }
    }
  }

  // Get all connected clients for debugging
  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  // Validate client access to auction
  validateAuctionAccess(): boolean {
    // TODO: Add proper validation logic
    // - Check if user belongs to the same tenant as the auction
    // - Check if auction is active
    // - Check if user has permission to view this auction
    return true;
  }
}
