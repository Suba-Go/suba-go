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
  /** Unique user presence for the room (userId -> sockets). */
  userSockets: Map<string, Set<WebSocket>>;
  /** Pending leave timers (userId -> timeout) to debounce reconnect thrash. */
  pendingLeaves: Map<string, NodeJS.Timeout>;
}

/** Simple token bucket used for WS rate-limits */
interface TokenBucket {
  tokens: number;
  lastRefillMs: number;
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
type BidResponseCacheEntry =
  | { ts: number; ok: true; itemId: string; data: any }
  | { ts: number; ok: false; itemId: string; reason: string };

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

  // --- WS anti-spam / rate limits for bidding (in-memory per instance) ---
  // User-level: prevents a single client from flooding.
  private readonly userBidBuckets = new Map<string, TokenBucket>();
  // Item-level: prevents global spikes on the same item.
  private readonly itemBidBuckets = new Map<string, TokenBucket>();
  // requestId de-dup for a short window (so retries don't get rate-limited)
  private readonly recentBidRequestIds = new Map<string, number>();

  /**
   * Response cache by requestId (per instance).
   *
   * Goal: make WS bidding idempotent for both SUCCESS and FAILURE.
   *
   * Why: some clients retry the same requestId after a reconnect, browser freeze,
   * or when they didn't receive the ACK due to transient network issues.
   *
   * The BidRealtimeService already handles SUCCESS idempotency (duplicate requestId
   * returns createdNow=false + bidPlacedData). This cache extends idempotency to
   * FAILURE cases too, so we don't re-run validations/DB lookups and we avoid
   * confusing UI sequences like "accepted" then "failed" for the same requestId.
   */
  private readonly bidResponseCache = new Map<string, BidResponseCacheEntry>();

  /**
   * In-flight de-duplication for bid requests (per instance).
   *
   * Why: some clients can emit the same WS bid message twice (double click,
   * React StrictMode double-invocation in dev, or reconnect edge-cases). Without
   * this guard, we may run two concurrent validations/transactions for the same
   * requestId on the same WS connection, producing confusing logs and UI states.
   */
  private readonly inFlightBidRequestIds = new Set<string>();

  // Tunables (env)
  private readonly wsBidUserRatePerSec = Number(
    process.env.WS_BID_USER_RATE_PER_SEC ?? 4
  );
  private readonly wsBidUserBurst = Number(process.env.WS_BID_USER_BURST ?? 4);
  private readonly wsBidItemRatePerSec = Number(
    process.env.WS_BID_ITEM_RATE_PER_SEC ?? 20
  );
  private readonly wsBidItemBurst = Number(process.env.WS_BID_ITEM_BURST ?? 30);
  private readonly wsBidRequestIdTtlMs = Number(
    process.env.WS_BID_REQUESTID_TTL_MS ?? 2 * 60 * 1000
  );

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

      server.clients.forEach((ws: WebSocket) => {
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

    // Join tenant-wide room for list-level real-time updates
    this.joinRoom(client, this.getTenantRoomKey(meta.tenantId), meta.tenantId, '__TENANT__');

    // Set up pong handler to mark client as alive
    client.on('pong', () => {
      const currentMeta = this.clients.get(client);
      if (currentMeta) {
        currentMeta.isAlive = true;
        this.clients.set(client, currentMeta);
      }
    });

    this.logger.log(`Client connected: ${user.email} (role: ${user.role})`);

    // Send initial connection acknowledgment (client should send HELLO to finalize handshake)
    this.sendMessage(client, {
      event: 'CONNECTED',
      data: {
        message: 'WebSocket connection established. Send HELLO to complete handshake, then join auctions.',
        email: user.email,
      },
    });
  }


  /**
   * Second handshake: client sends HELLO to finalize the session.
   * The frontend waits for HELLO_OK before considering the connection "ready".
   */
  @SubscribeMessage('HELLO')
  handleHello(
    @MessageBody() body: { token?: string; clientInfo?: any },
    @ConnectedSocket() client: WebSocket
  ) {
    const meta = this.clients.get(client);

    if (!meta) {
      this.sendError(client, WsErrorCode.UNAUTHORIZED, 'No session found');
      return;
    }

    this.logger.log(`HELLO received from ${meta.email}`);

    this.sendMessage(client, {
      event: 'HELLO_OK',
      data: {
        ok: true,
        user: {
          userId: meta.userId,
          email: meta.email,
          role: meta.role,
          tenantId: meta.tenantId,
        },
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
    const participantCount = room ? room.userSockets.size : 0;

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

    // PRO: also send an explicit snapshot event. This covers cases where the client
    // joins *after* a status broadcast (e.g. manager opens the page late) and
    // wants to apply the latest state immediately without relying on polling.
    // The payload mirrors JOINED for maximum compatibility.
    this.sendMessage(client, {
      event: 'AUCTION_SNAPSHOT',
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

    // Send confirmation to client
    this.sendMessage(client, {
      event: 'LEFT',
      data: {
        room: roomKey,
        auctionId,
      },
    });
  }


  /**
   * Application-level PING/PONG.
   *
   * Why not rely only on WS protocol ping frames?
   * - Browsers don't expose server timestamps for protocol-level pong.
   * - We need serverTimeMs to do NTP-style clock sync on the client for precise countdowns.
   */
  @SubscribeMessage('PING')
  handlePing(
    @MessageBody() data: { requestId?: string; clientTimeMs?: number },
    @ConnectedSocket() client: WebSocket
  ) {
    // Echo requestId + clientTimeMs back, and include server time.
    this.sendMessage(client, {
      event: 'PONG',
      data: {
        requestId: data?.requestId,
        clientTimeMs: typeof data?.clientTimeMs === 'number' ? data.clientTimeMs : undefined,
        serverTimeMs: Date.now(),
      },
    });
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

    // Opportunistically prune in-memory limiter state + response cache.
    const nowMs = Date.now();
    this.pruneRateLimitState(nowMs);

    // Fast-path: if we already processed this requestId, immediately reply with the same outcome.
    // This makes WS bidding idempotent for both SUCCESS and FAILURE.
    const cached = this.bidResponseCache.get(data.requestId);
    if (cached) {
      this.logger.debug(
        `[${this.instanceId}] Returning cached bid outcome req=${data.requestId} ok=${cached.ok} user=${meta.email}`
      );
      if (cached.ok === true) {
        this.sendMessage(client, { event: 'BID_PLACED', data: cached.data });
      } else {
        this.sendBidRejected(client, cached.itemId, cached.reason, data.requestId);
      }
      return;
    }

    // In-flight de-dup (same requestId received twice before the first finishes).
    // We intentionally do NOT send BID_REJECTED here; the first request will
    // either broadcast BID_PLACED (success) or send BID_REJECTED (failure).
    if (this.inFlightBidRequestIds.has(data.requestId)) {
      this.logger.debug(
        `[${this.instanceId}] Duplicate in-flight bid ignored req=${data.requestId} user=${meta.email}`
      );
      return;
    }
    this.inFlightBidRequestIds.add(data.requestId);

    try {
      // Rate-limit (USER + ITEM) to avoid flooding and weird edge-case overloads.
      // IMPORTANT: don't punish idempotent retries -> if we already saw this requestId recently,
      // skip rate-limits and forward to the service (which is idempotent by requestId).
      // Rate-limit (USER + ITEM) to avoid flooding and weird edge-case overloads.
      // NOTE: prune already ran above.
      if (!this.recentBidRequestIds.has(data.requestId)) {
        this.recentBidRequestIds.set(data.requestId, nowMs);

        const userKey = `${meta.tenantId ?? data.tenantId}:${meta.userId}`;
        const itemKey = `${data.tenantId}:${data.auctionItemId}`;

        const userOk = this.consumeToken(
          this.userBidBuckets,
          userKey,
          this.wsBidUserRatePerSec,
          this.wsBidUserBurst,
          nowMs
        );
        if (!userOk) {
          this.sendBidRejected(
            client,
            data.auctionItemId,
            'Estás pujando muy rápido. Intenta nuevamente en un momento.',
            data.requestId
          );
          return;
        }

        const itemOk = this.consumeToken(
          this.itemBidBuckets,
          itemKey,
          this.wsBidItemRatePerSec,
          this.wsBidItemBurst,
          nowMs
        );
        if (!itemOk) {
          this.sendBidRejected(
            client,
            data.auctionItemId,
            'Hay muchas pujas para este ítem. Intenta nuevamente en un momento.',
            data.requestId
          );
          return;
        }
      }

      // Log the bid attempt with instance identifier
      this.logger.log(
        `[${this.instanceId}] Bid attempt req=${data.requestId}: ${meta.email} - $${data.amount} on item ${data.auctionItemId}`
      );

      // Call BidRealtimeService to process the bid
      // The service will validate, save to DB with requestId, and broadcast
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

      // Cache SUCCESS outcome (idempotent by requestId).
      this.bidResponseCache.set(data.requestId, {
        ts: Date.now(),
        ok: true,
        itemId: data.auctionItemId,
        data: result.bidPlacedData,
      });

      // Log *the accepted amount* from the service (not the raw client payload)
      // to avoid confusing logs when the client retries with a different amount.
      this.logger.log(
        `[${this.instanceId}] Bid accepted req=${data.requestId} for item ${data.auctionItemId} amount=$${result.bidPlacedData.amount} createdNow=${result.createdNow}`
      );

      // Success:
      // - When createdNow=true, the service already broadcasted BID_PLACED to the room.
      // - When createdNow=false (duplicate requestId), we must still ACK the bidder so the UI stops loading.
      if (result && result.createdNow === false) {
        this.sendMessage(client, {
          event: 'BID_PLACED',
          data: result.bidPlacedData,
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al procesar la puja';
      this.logger.error(
        `Bid placement failed [req=${data.requestId}] user=${meta?.email ?? 'unknown'} tenant=${data.tenantId ?? 'unknown'} auction=${data.auctionId ?? 'unknown'} item=${data.auctionItemId}: ${message}`
      );

      // IMPORTANT: reply with BID_REJECTED so the frontend can stop the loading state.
      if (data?.auctionItemId) {
        // Cache FAILURE outcome (idempotent by requestId).
        if (data?.requestId) {
          this.bidResponseCache.set(data.requestId, {
            ts: Date.now(),
            ok: false,
            itemId: data.auctionItemId,
            reason: message,
          });
        }
        this.sendBidRejected(client, data.auctionItemId, message, data.requestId);
      } else {
        this.sendError(client, WsErrorCode.INVALID_BID, message);
      }
    } finally {
      this.inFlightBidRequestIds.delete(data.requestId);
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

    const toIso = (v: any): string | undefined => {
      if (!v) return undefined;
      if (typeof v === 'string') return v;
      if (v instanceof Date) return v.toISOString();
      try {
        return new Date(v).toISOString();
      } catch {
        return undefined;
      }
    };

    const serverTimeMs = Date.now();

    const safeAuction = auction
      ? {
          ...auction,
          startTime: toIso(auction.startTime),
          endTime: toIso(auction.endTime),
        }
      : undefined;

    this.logger.log(
      `Broadcasting status change for auction ${auctionId}: ${status}`
    );

    this.broadcastToRoom(roomKey, {
      event: 'AUCTION_STATUS_CHANGED',
      data: {
        auctionId,
        tenantId,
        status,
        auction: safeAuction,
        timestamp: new Date().toISOString(),
        serverTimeMs,
      },
    });

    // Also broadcast to the tenant-wide room so users can update their lists without joining every auction room.
    this.broadcastToRoom(this.getTenantRoomKey(tenantId), {
      event: 'AUCTION_STATUS_CHANGED',
      data: {
        auctionId,
        tenantId,
        status,
        auction: safeAuction,
        timestamp: new Date().toISOString(),
        serverTimeMs,
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
        userSockets: new Map(),
        pendingLeaves: new Map(),
      });
    }

    const room = this.rooms.get(roomKey)!;
    room.clients.add(client);

    // --- Presence (unique users) ---
    // If there is a pending debounced leave for this user, cancel it.
    const pending = room.pendingLeaves.get(meta.userId);
    if (pending) {
      clearTimeout(pending);
      room.pendingLeaves.delete(meta.userId);
    }

    const sockets = room.userSockets.get(meta.userId) ?? new Set<WebSocket>();
    sockets.add(client);
    room.userSockets.set(meta.userId, sockets);

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

      // --- Presence (unique users) ---
      const sockets = room.userSockets.get(meta.userId);
      if (sockets) {
        sockets.delete(client);

        if (sockets.size === 0) {
          // Debounce leaving for a short grace window.
          // This avoids UI flicker when a browser rapidly reconnects (common on mobile
          // networks and during dev refresh/re-render loops).
          //
          // IMPORTANT: we keep the (userId -> empty sockets set) entry during the grace
          // period so the participant count does not flap. If the user reconnects, we
          // cancel the timer and add the socket back.
          room.userSockets.set(meta.userId, sockets);

          // Only schedule a broadcast if there isn't already one pending.
          if (!room.pendingLeaves.has(meta.userId)) {
            const t = setTimeout(() => {
              const currentRoom = this.rooms.get(roomKey);
              if (!currentRoom) return;

              currentRoom.pendingLeaves.delete(meta.userId);
              const currentSockets = currentRoom.userSockets.get(meta.userId);

              // If still empty after the grace period, remove presence and broadcast.
              if (!currentSockets || currentSockets.size === 0) {
                currentRoom.userSockets.delete(meta.userId);
                this.broadcastToRoom(roomKey, {
                  event: 'PARTICIPANT_COUNT',
                  data: {
                    auctionId: currentRoom.auctionId,
                    count: currentRoom.userSockets.size,
                  },
                });
              }
            }, 1000);
            room.pendingLeaves.set(meta.userId, t);
          }
        } else {
          room.userSockets.set(meta.userId, sockets);
        }
      }

      // Delete room if empty
      if (room.clients.size === 0) {
        // Clear any pending leave timers.
        for (const [, t] of room.pendingLeaves) {
          clearTimeout(t);
        }
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
   * Tenant-wide broadcast room.
   * All connected clients join this room on connect, so they can receive
   * auction list updates (status/time changes) even if they haven't joined
   * a specific auction room yet.
   */
  private getTenantRoomKey(tenantId: string): string {
    return this.getRoomKey(tenantId, '__TENANT__');
  }

  /**
   * Token bucket consumption helper for in-memory WS rate limits.
   * Returns true if a token was consumed (allowed) or false if rate-limited.
   */
  private consumeToken(
    map: Map<string, TokenBucket>,
    key: string,
    ratePerSec: number,
    burst: number,
    nowMs: number
  ): boolean {
    const safeRate = Number.isFinite(ratePerSec) && ratePerSec > 0 ? ratePerSec : 1;
    const safeBurst = Number.isFinite(burst) && burst > 0 ? burst : 1;

    const bucket = map.get(key) ?? { tokens: safeBurst, lastRefillMs: nowMs };

    const elapsedMs = Math.max(0, nowMs - bucket.lastRefillMs);
    const refill = (elapsedMs * safeRate) / 1000;
    bucket.tokens = Math.min(safeBurst, bucket.tokens + refill);
    bucket.lastRefillMs = nowMs;

    if (bucket.tokens < 1) {
      map.set(key, bucket);
      return false;
    }

    bucket.tokens -= 1;
    map.set(key, bucket);
    return true;
  }

  /**
   * Keep in-memory limiter maps bounded.
   * Called opportunistically (no strict schedule needed).
   */
  private pruneRateLimitState(nowMs: number) {
    const cutoff = nowMs - Math.max(this.wsBidRequestIdTtlMs, 60_000);

    // requestId TTL cleanup
    for (const [reqId, ts] of this.recentBidRequestIds) {
      if (ts < cutoff) this.recentBidRequestIds.delete(reqId);
    }

    // response cache TTL cleanup
    for (const [reqId, entry] of this.bidResponseCache) {
      if (entry.ts < cutoff) this.bidResponseCache.delete(reqId);
    }

    // bucket cleanup (inactive keys)
    const bucketCutoff = nowMs - 5 * 60 * 1000;
    for (const [k, b] of this.userBidBuckets) {
      if (b.lastRefillMs < bucketCutoff) this.userBidBuckets.delete(k);
    }
    for (const [k, b] of this.itemBidBuckets) {
      if (b.lastRefillMs < bucketCutoff) this.itemBidBuckets.delete(k);
    }
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
   * Notify a specific user that they were invited/registered to an auction.
   *
   * This is sent out-of-room (tenant-wide) so the user's "My Auctions" view can
   * update in real time without having to join the auction room.
   */
  notifyAuctionInvited(tenantId: string, userId: string, auction: any) {
    const toIso = (v: unknown): string => {
      if (typeof v === 'string') return v;
      if (v instanceof Date) return v.toISOString();
      try {
        return new Date(v as any).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const payload: WsServerMessage = {
      event: 'AUCTION_INVITED',
      data: {
        auction: {
          id: String(auction?.id ?? ''),
          title: auction?.title,
          description: auction?.description ?? null,
          status: String(auction?.status ?? 'PENDIENTE'),
          startTime: toIso(auction?.startTime),
          endTime: toIso(auction?.endTime),
          type: auction?.type,
        },
        serverTimeMs: Date.now(),
      },
    };

    // Deliver to all sockets for that user in this tenant (one user can have multiple tabs).
    let delivered = 0;
    this.server.clients.forEach((ws: WebSocket) => {
      const meta = this.clients.get(ws);
      if (!meta) return;
      if (meta.userId !== userId) return;
      if (tenantId && meta.tenantId && meta.tenantId !== tenantId) return;
      this.sendMessage(ws, payload);
      delivered += 1;
    });

    if (delivered > 0) {
      this.logger.log(
        `AUCTION_INVITED sent to user ${userId} (${delivered} socket(s)) for auction ${String(
          auction?.id ?? ''
        )}`
      );
    }
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
    return room ? room.userSockets.size : 0;
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

    // Return one entry per unique userId.
    for (const [userId, sockets] of room.userSockets) {
      // Pick the first socket to read metadata.
      const first = sockets.values().next().value as WebSocket | undefined;
      const meta = first ? this.clients.get(first) : undefined;
      if (meta) {
        users.push({
          userId,
          email: meta.email,
          role: meta.role,
          isAlive: meta.isAlive,
        });
      }
    }

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
        count: room.userSockets.size,
      });
    });
    return rooms;
  }
}
