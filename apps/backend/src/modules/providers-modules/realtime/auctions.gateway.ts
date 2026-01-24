/**
 * @file auctions.gateway.ts
 * @description WebSocket gateway for auction-specific real-time features
 * Handles auction rooms, bid placement, and real-time updates
 * @author Suba&Go
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef, Optional } from '@nestjs/common';
import type { Server, WebSocket } from 'ws';
import type { JwtPayload } from '@suba-go/shared-validation';
import { WsServerMessage, WsErrorCode } from '@suba-go/shared-validation';
import { PrismaService } from '../prisma/prisma.service';
import type { BidRealtimeService } from '../../app-modules/bids/services/bid-realtime.service';
import { randomUUID } from 'crypto';

/**
 * Client metadata stored per connection
 */
interface ClientMeta {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  companyId?: string;
  isAlive: boolean;
  // Current auction rooms the client is in
  rooms: Set<string>; // Format: "tenantId:auctionId"
}

/**
 * Room metadata for each auction
 */
interface RoomMeta {
  tenantId: string;
  auctionId: string;
  clients: Set<WebSocket>;
}

/**
 * Auctions WebSocket Gateway
 *
 * Handles:
 * - Auction room management (join/leave)
 * - Real-time bid placement
 * - Bid updates broadcast to room participants
 * - Auction status changes
 * - Participant count tracking
 */
@WebSocketGateway({ path: '/ws' })
export class AuctionsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(AuctionsGateway.name);
  private readonly clients = new WeakMap<WebSocket, ClientMeta>();
  private readonly rooms = new Map<string, RoomMeta>(); // Key: "tenantId:auctionId"
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly instanceId = randomUUID();

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(
      forwardRef(() => {
        // Lazy load to avoid circular dependency
        const {
          BidRealtimeService,
        } = require('../../app-modules/bids/services/bid-realtime.service');
        return BidRealtimeService;
      })
    )
    private readonly bidRealtimeService?: BidRealtimeService
  ) {}

  /**
   * Called once when the gateway is initialized
   */
  afterInit(server: Server) {
    this.logger.log(
      `Auctions WebSocket Gateway initialized (instance ${this.instanceId})`
    );

    // Heartbeat: ping all clients every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      let aliveCount = 0;
      let deadCount = 0;

      server.clients.forEach((ws: any) => {
        const meta = this.clients.get(ws);
        if (!meta) return;

        // If client didn't respond to last ping, terminate
        if (meta.isAlive === false) {
          deadCount++;
          this.logger.debug(`Terminating dead connection: ${meta.email}`);
          return ws.terminate();
        }

        // Mark as potentially dead and send ping
        meta.isAlive = false;
        this.clients.set(ws, meta);
        ws.ping();
        aliveCount++;
      });

      if (aliveCount > 0 || deadCount > 0) {
        this.logger.debug(
          `Heartbeat: ${aliveCount} alive, ${deadCount} terminated`
        );
      }
    }, 30000);

    // Clean up interval when server closes
    server.on('close', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  /**
   * Called when a client connects
   */
  handleConnection(client: WebSocket) {
    // Extract user info that was attached during upgrade auth
    const user = (client as any).user as JwtPayload | undefined;

    if (!user) {
      this.logger.warn(
        'Client connected without user info - should not happen'
      );
      client.close(1008, 'Unauthorized');
      return;
    }

    // Initialize client metadata
    const meta: ClientMeta = {
      userId: user.sub || '',
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      companyId: user.companyId,
      isAlive: true,
      rooms: new Set(),
    };

    this.clients.set(client, meta);

    // Set up pong handler to mark client as alive
    client.on('pong', () => {
      const currentMeta = this.clients.get(client);
      if (currentMeta) {
        currentMeta.isAlive = true;
        this.clients.set(client, currentMeta);
      }
    });

    this.logger.log(`Client connected: ${user.email} (role: ${user.role})`);

    // Send initial connection acknowledgment (no handshake needed)
    this.sendMessage(client, {
      event: 'CONNECTED',
      data: {
        message: 'WebSocket connection established. Ready to join auctions.',
        email: user.email,
      },
    });
  }

  /**
   * Called when a client disconnects
   */
  handleDisconnect(client: WebSocket) {
    const meta = this.clients.get(client);
    if (!meta) return;

    // Remove client from all rooms
    meta.rooms.forEach((roomKey) => {
      this.leaveRoom(client, roomKey);
    });

    this.logger.log(`Client disconnected: ${meta.email}`);
  }

  /**
   * Handle JOIN_AUCTION message
   * Client joins an auction room to receive real-time updates
   */
  @SubscribeMessage('JOIN_AUCTION')
  async handleJoinAuction(
    @MessageBody() data: { tenantId: string; auctionId: string },
    @ConnectedSocket() client: WebSocket
  ) {
    const meta = this.clients.get(client);
    if (!meta) {
      this.sendError(client, WsErrorCode.UNAUTHORIZED, 'Not authenticated');
      return;
    }

    const { tenantId, auctionId } = data;

    // Check if auction exists and belongs to the tenant
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      this.sendError(
        client,
        WsErrorCode.AUCTION_NOT_FOUND,
        'Subasta no encontrada'
      );
      return;
    }

    if (auction.tenantId !== tenantId) {
      this.sendError(
        client,
        WsErrorCode.FORBIDDEN,
        'La subasta no pertenece a este tenant'
      );
      return;
    }

    // Validate access: ADMIN can access all, AUCTION_MANAGER can access their tenant's auctions
    // Regular users will be auto-registered if they belong to the same tenant
    const isAdmin = meta.role === 'ADMIN';
    const isAuctionManager = meta.role === 'AUCTION_MANAGER';

    if (!isAdmin && !isAuctionManager) {
      // For regular users, check if they belong to the same tenant
      if (meta.tenantId !== tenantId) {
        this.sendError(
          client,
          WsErrorCode.FORBIDDEN,
          'No tienes acceso a esta subasta'
        );
        return;
      }

      // Auto-register user if not already registered
      const registration = await this.prisma.auctionRegistration.findUnique({
        where: {
          userId_auctionId: {
            userId: meta.userId,
            auctionId,
          },
        },
      });

      if (!registration) {
        this.logger.log(
          `Auto-registering user ${meta.email} for auction ${auctionId}`
        );
        await this.prisma.auctionRegistration.create({
          data: {
            userId: meta.userId,
            auctionId,
          },
        });
      }
    } else if (isAuctionManager && meta.tenantId !== tenantId) {
      // Auction managers can only access their own tenant's auctions
      this.sendError(client, WsErrorCode.FORBIDDEN, 'No tienes acceso a esta subasta');
      return;
    }

    const roomKey = this.getRoomKey(tenantId, auctionId);

    // Ensure only one connection per user per auction room
    const existingRoom = this.rooms.get(roomKey);
    if (existingRoom) {
      const duplicates: WebSocket[] = [];
      existingRoom.clients.forEach((c) => {
        const m = this.clients.get(c);
        if (c !== client && m && m.userId === meta.userId) {
          duplicates.push(c);
        }
      });

      if (duplicates.length > 0) {
        this.logger.warn(
          `Duplicate connections for user ${meta.email} in room ${roomKey} -> removing ${duplicates.length} old connection(s)`
        );
        for (const dup of duplicates) {
          // Inform the old connection and remove it from the room
          this.sendMessage(dup, {
            event: 'KICKED_DUPLICATE',
            data: {
              room: roomKey,
              reason:
                'Se detectó otra pestaña conectada a esta subasta con tu usuario. Esta conexión será removida de la sala.',
            },
          });
          this.leaveRoom(dup, roomKey);

          // IMPORTANT: The old connection must be closed. Otherwise we end up with
          // zombie sockets that keep the heartbeat count growing and can cause
          // bid flow issues (clients remain connected but not joined).
          try {
            dup.close(4000, 'Duplicate connection');
          } catch {
            // ignore
          }
        }
      }
    }

    // If already joined this room, avoid sending duplicate JOINED events
    if (meta.rooms.has(roomKey)) {
      this.logger.debug(
        `[${this.instanceId}] [JOIN] Ignoring duplicate join from ${meta.email} for room ${roomKey}`
      );
      return;
    }

    // Add client to room
    this.joinRoom(client, roomKey, tenantId, auctionId);

    const room = this.rooms.get(roomKey);
    const participantCount = room ? room.clients.size : 0;

    this.logger.log(
      `${meta.email} joined auction ${auctionId} (${participantCount} participants)`
    );
    // Snapshot of per-item clocks so reconnecting/late-joining clients sync immediately.
    const auctionItems = await this.prisma.auctionItem.findMany({
      where: { auctionId },
      select: { id: true, startTime: true, endTime: true },
    });


    // Send confirmation + server time sync to client
    // NOTE: keep payload compatible with shared WS contract.
    this.sendMessage(client, {
      event: 'JOINED',
      data: {
        room: roomKey,
        auctionId,
        participantCount,
        serverTimeMs: Date.now(),
        auction: {
          id: auction.id,
          status: auction.status,
          startTime: auction.startTime.toISOString(),
          endTime: auction.endTime.toISOString(),
        },
        auctionItems: auctionItems.map((ai) => ({
          id: ai.id,
          startTime: (ai.startTime ?? auction.startTime).toISOString(),
          endTime: (ai.endTime ?? auction.endTime).toISOString(),
        })),
      },
    });

    // Broadcast participant count to all room members
    this.broadcastToRoom(roomKey, {
      event: 'PARTICIPANT_COUNT',
      data: {
        auctionId,
        count: participantCount,
      },
    });
  }

  /**
   * Handle LEAVE_AUCTION message
   */
  @SubscribeMessage('LEAVE_AUCTION')
  handleLeaveAuction(
    @MessageBody() data: { tenantId: string; auctionId: string },
    @ConnectedSocket() client: WebSocket
  ) {
    const meta = this.clients.get(client);
    if (!meta) return;

    const { tenantId, auctionId } = data;
    const roomKey = this.getRoomKey(tenantId, auctionId);

    this.leaveRoom(client, roomKey);

    const room = this.rooms.get(roomKey);
    const participantCount = room ? room.clients.size : 0;

    this.logger.log(
      `${meta.email} left auction ${auctionId} (${participantCount} remaining)`
    );

    // Send confirmation to client
    this.sendMessage(client, {
      event: 'LEFT',
      data: {
        room: roomKey,
        auctionId,
      },
    });

    // Broadcast updated participant count
    if (room) {
      this.broadcastToRoom(roomKey, {
        event: 'PARTICIPANT_COUNT',
        data: {
          auctionId,
          count: participantCount,
        },
      });
    }
  }

  /**
   * Handle PLACE_BID message
   * Validates the request and forwards to BidRealtimeService for processing
   */
  @SubscribeMessage('PLACE_BID')
  async handlePlaceBid(
    @MessageBody()
    data: {
      tenantId: string;
      auctionId: string;
      auctionItemId: string;
      amount: number;
      requestId: string;
    },
    @ConnectedSocket() client: WebSocket
  ) {
    const meta = this.clients.get(client);
    if (!meta) {
      this.sendError(client, WsErrorCode.UNAUTHORIZED, 'Not authenticated');
      return;
    }

    // Validate user role (only USER can place bids)
    if (meta.role !== 'USER') {
      this.sendBidRejected(client, data.auctionItemId, 'Solo los usuarios pueden realizar pujas', data.requestId);
      return;
    }

    // Validate tenant access (USER must match tenant)
    if (meta.tenantId !== data.tenantId) {
      this.sendBidRejected(client, data.auctionItemId, 'No tienes acceso a esta subasta', data.requestId);
      return;
    }

    // Validate client is in the auction room
    const roomKey = this.getRoomKey(data.tenantId, data.auctionId);
    if (!meta.rooms.has(roomKey)) {
      this.sendBidRejected(client, data.auctionItemId, 'Debes unirte a la subasta antes de pujar', data.requestId);
      return;
    }

    // Validate requestId for idempotency
    if (!data.requestId) {
      this.sendBidRejected(client, data.auctionItemId, 'requestId requerido');
      return;
    }

    // Log the bid attempt with instance identifier
    this.logger.log(
      `[${this.instanceId}] Bid attempt req=${data.requestId}: ${meta.email} - $${data.amount} on item ${data.auctionItemId}`
    );

    // Call BidRealtimeService to process the bid
    // The service will validate, save to DB with requestId, and broadcast
    try {
      if (!this.bidRealtimeService) {
        this.logger.error('BidRealtimeService not injected!');
        this.sendError(
          client,
          WsErrorCode.INTERNAL_ERROR,
          'Servicio de pujas no disponible'
        );
        return;
      }

      const result = await this.bidRealtimeService.placeBid(
        data.auctionItemId,
        data.amount,
        meta.userId,
        data.tenantId,
        data.requestId
      );

      this.logger.log(
        `[${this.instanceId}] Bid accepted req=${data.requestId} for item ${data.auctionItemId} amount=$${data.amount}`
      );

      // Success:
      // - When createdNow=true, the service already broadcasted BID_PLACED to the room.
      // - When createdNow=false (duplicate requestId), we must still ACK the bidder so the UI stops loading.
      if (result && result.createdNow === false) {
        this.sendMessage(client, { event: 'BID_PLACED', data: result.bidPlacedData });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al procesar la puja';
      this.logger.error(`Bid placement failed: ${message}`);

      // IMPORTANT: reply with BID_REJECTED so the frontend can stop the loading state.
      if (data?.auctionItemId) {
        this.sendBidRejected(client, data.auctionItemId, message, data.requestId);
      } else {
        this.sendError(client, WsErrorCode.INVALID_BID, message);
      }
    }
  }

  /**
   * Broadcast a message to all clients in a room
   */
  broadcastToRoom(roomKey: string, message: WsServerMessage) {
    const room = this.rooms.get(roomKey);
    if (!room) return;

    room.clients.forEach((client) => {
      if (client.readyState === 1) {
        // 1 = OPEN
        this.sendMessage(client, message);
      }
    });
  }

  /**
   * Broadcast a BID_PLACED event with role-based masking.
   *
   * Client requirement:
   * - USER must see only the pseudonym (public_name)
   * - AUCTION_MANAGER/ADMIN must see the real user name (or email fallback)
   *
   * We cannot broadcast the same payload to everyone because it would leak
   * the real identity of bidders to other USERS.
   */
  broadcastBidPlaced(roomKey: string, data: any, names: { userDisplayName: string; managerDisplayName: string }) {
    const room = this.rooms.get(roomKey);
    if (!room) return;

    room.clients.forEach((client) => {
      if (client.readyState !== 1) return; // OPEN
      const meta = this.clients.get(client);
      const isUser = meta?.role === 'USER';
      this.sendMessage(client, {
        event: 'BID_PLACED',
        data: {
          ...data,
          userName: isUser ? names.userDisplayName : names.managerDisplayName,
        },
      });
    });
  }

  /**
   * Broadcast a message to all clients in a room EXCEPT the sender
   */
  broadcastToRoomExcept(
    roomKey: string,
    message: WsServerMessage,
    excludeClient: WebSocket
  ) {
    const room = this.rooms.get(roomKey);
    if (!room) return;

    room.clients.forEach((client) => {
      if (client !== excludeClient && client.readyState === 1) {
        this.sendMessage(client, message);
      }
    });
  }

  /**
   * Broadcast auction status change to all clients in the auction room
   * Called by external services (e.g., scheduler, cancel endpoint)
   */
  broadcastAuctionStatusChange(
    tenantId: string,
    auctionId: string,
    status: string,
    auction?: any
  ) {
    const roomKey = this.getRoomKey(tenantId, auctionId);

    this.logger.log(
      `📢 Broadcasting status change for auction ${auctionId}: ${status}`
    );

    this.broadcastToRoom(roomKey, {
      event: 'AUCTION_STATUS_CHANGED',
      data: {
        auctionId,
        status,
        auction,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Join a room
   */
  private joinRoom(
    client: WebSocket,
    roomKey: string,
    tenantId: string,
    auctionId: string
  ) {
    const meta = this.clients.get(client);
    if (!meta) return;

    // Create room if it doesn't exist
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, {
        tenantId,
        auctionId,
        clients: new Set(),
      });
    }

    const room = this.rooms.get(roomKey)!;
    room.clients.add(client);
    meta.rooms.add(roomKey);
    this.clients.set(client, meta);
  }

  /**
   * Leave a room
   */
  private leaveRoom(client: WebSocket, roomKey: string) {
    const meta = this.clients.get(client);
    if (!meta) return;

    const room = this.rooms.get(roomKey);
    if (room) {
      room.clients.delete(client);

      // Delete room if empty
      if (room.clients.size === 0) {
        this.rooms.delete(roomKey);
        this.logger.debug(`Room ${roomKey} deleted (empty)`);
      }
    }

    meta.rooms.delete(roomKey);
    this.clients.set(client, meta);
  }

  /**
   * Get room key from tenantId and auctionId
   */
  private getRoomKey(tenantId: string, auctionId: string): string {
    return `${tenantId}:${auctionId}`;
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(client: WebSocket, message: WsServerMessage) {
    if (client.readyState === 1) {
      // 1 = OPEN
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Send an error message to a client
   */
  private sendError(client: WebSocket, code: WsErrorCode, message: string) {
    this.sendMessage(client, {
      event: 'ERROR',
      data: {
        code,
        message,
      },
    });
  }

  /**
   * Send a BID_REJECTED message (used to ensure the UI can recover from bid errors)
   */
  private sendBidRejected(
    client: WebSocket,
    auctionItemId: string,
    reason: string,
    requestId?: string
  ) {
    this.sendMessage(client, {
      event: 'BID_REJECTED',
      data: {
        code: WsErrorCode.INVALID_BID,
        reason,
        auctionItemId,
        requestId,
      },
    });
  }

  /**
   * Get all clients in a room
   */
  getRoomClients(tenantId: string, auctionId: string): WebSocket[] {
    const roomKey = this.getRoomKey(tenantId, auctionId);
    const room = this.rooms.get(roomKey);
    return room ? Array.from(room.clients) : [];
  }

  /**
   * Get participant count for an auction
   */
  getParticipantCount(tenantId: string, auctionId: string): number {
    const roomKey = this.getRoomKey(tenantId, auctionId);
    const room = this.rooms.get(roomKey);
    return room ? room.clients.size : 0;
  }

  /**
   * Get connected users for an auction (with userId and metadata)
   */
  getConnectedUsers(
    tenantId: string,
    auctionId: string
  ): Array<{
    userId: string;
    email: string;
    role: string;
    isAlive: boolean;
  }> {
    const roomKey = this.getRoomKey(tenantId, auctionId);
    const room = this.rooms.get(roomKey);
    if (!room) return [];

    const users: Array<{
      userId: string;
      email: string;
      role: string;
      isAlive: boolean;
    }> = [];

    room.clients.forEach((client) => {
      const meta = this.clients.get(client);
      if (meta) {
        users.push({
          userId: meta.userId,
          email: meta.email,
          role: meta.role,
          isAlive: meta.isAlive,
        });
      }
    });

    return users;
  }

  /**
   * Check if a specific user is connected to an auction
   */
  isUserConnected(
    tenantId: string,
    auctionId: string,
    userId: string
  ): boolean {
    const connectedUsers = this.getConnectedUsers(tenantId, auctionId);
    return connectedUsers.some((user) => user.userId === userId);
  }

  /**
   * Get all active rooms
   */
  getActiveRooms(): Array<{
    tenantId: string;
    auctionId: string;
    count: number;
  }> {
    const rooms: Array<{ tenantId: string; auctionId: string; count: number }> =
      [];
    this.rooms.forEach((room, key) => {
      rooms.push({
        tenantId: room.tenantId,
        auctionId: room.auctionId,
        count: room.clients.size,
      });
    });
    return rooms;
  }
}
