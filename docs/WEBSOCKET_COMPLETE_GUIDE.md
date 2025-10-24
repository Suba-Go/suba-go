# WebSocket Complete Guide - Suba&Go Real-Time Auction System

**Status:** ✅ WORKING  
**Last Updated:** 2025-10-23  
**Architecture:** Native WebSocket with NestJS 11 + Double Handshake Pattern

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Authentication](#authentication)
4. [Message Protocol](#message-protocol)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Integration Guide](#integration-guide)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Backend

```bash
pnpm nx serve backend
# WebSocket available at: ws://localhost:3001/ws
```

### Frontend

```typescript
import { useAuctionWebSocket } from '@/hooks/use-auction-websocket';

const { bids, placeBid, isAuthenticated, participantCount } = useAuctionWebSocket({
  tenantId: 'tenant-id',
  auctionId: 'auction-id',
});
```

### Test Connection

```bash
# Node.js
node tools/test-websocket.js <jwt-token> <tenant-id> <auction-id> <item-id>

# Browser Console
const token = document.cookie.split(';').find(c => c.includes('accessToken'))?.split('=')[1];
const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## Architecture Overview

### Double Handshake Pattern

```
Client                          Server
  |                               |
  |-- HTTP Upgrade (JWT) -------->|  1. Extract token from query/header/cookie
  |                               |  2. Verify JWT signature
  |                               |  3. Attach user to WebSocket instance
  |<-- WebSocket Open ------------|
  |                               |
  |-- HELLO message ------------->|  4. Finalize handshake
  |<-- HELLO_OK ------------------|
  |                               |
  ✅ AUTHENTICATED                |
```

**Why Double Handshake?**

- **Security**: JWT validated before WebSocket establishment
- **Clean separation**: HTTP auth + application-level handshake
- **Early rejection**: Unauthorized connections rejected before resources allocated
- **Additional context**: Client can send extra info in HELLO message

### File Structure

```
apps/backend/src/
├── main.ts                                    # Bootstrap with post-init auth binding
└── modules/providers-modules/realtime/
    ├── ws-auth.adapter.ts                     # Custom WebSocket adapter with JWT auth
    ├── realtime.gateway.ts                    # Base gateway with HELLO handshake
    ├── auctions.gateway.ts                    # Auction-specific logic
    └── realtime.module.ts                     # Module registration

apps/frontend/src/
├── lib/ws-client.ts                           # Singleton WebSocket manager
├── hooks/use-auction-websocket.ts             # React hook for auctions
└── components/auctions/
    └── auction-active-bidding-view.tsx        # Live bidding UI
```

---

## Authentication

### Token Sources (Priority Order)

1. **Query Parameter**: `?token=xxx`
2. **Authorization Header**: `Bearer xxx`
3. **Cookie**: `token=xxx` or `accessToken=xxx`

### Connection Flow

```typescript
// Frontend
const token = session.tokens.accessToken;
const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);

ws.onopen = () => {
  ws.send(JSON.stringify({ event: 'HELLO', data: {} }));
};

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.event === 'HELLO_OK') {
    // Authenticated! Can now join auctions
  }
};
```

### Backend Authentication

**File:** `apps/backend/src/modules/providers-modules/realtime/ws-auth.adapter.ts`

**Key Implementation:**

```typescript
bindClientConnect(server: WebSocketServer, callback: (...args: any[]) => void) {
  const httpServer = (this as any).httpServer?.getHttpServer?.();

  // 🔥 CRITICAL: Remove NestJS's default upgrade handler
  httpServer.removeAllListeners('upgrade');

  // Add authenticated upgrade handler
  httpServer.on('upgrade', (request, socket, head) => {
    const token = this.extractToken(request);
    const payload = this.jwtService.verify(token, { secret });

    server.handleUpgrade(request, socket, head, (ws) => {
      ws.user = payload; // ← Attach user!
      server.emit('connection', ws, request);
    });
  });
}
```

**Critical Fix:** Must bind authentication AFTER server starts:

```typescript
// apps/backend/src/main.ts
const wsAdapter = new WsAuthAdapter(app);
app.useWebSocketAdapter(wsAdapter);

await app.listen(3001, '0.0.0.0');

// CRITICAL: Bind authentication AFTER server starts
wsAdapter.bindAuthenticationAfterInit();
```

---

## Message Protocol

### Client → Server

| Event           | Data                                                          | Description                         |
| --------------- | ------------------------------------------------------------- | ----------------------------------- |
| `HELLO`         | `{ clientInfo?: any }`                                        | Complete handshake after connection |
| `JOIN_AUCTION`  | `{ tenantId, auctionId }`                                     | Join auction room                   |
| `LEAVE_AUCTION` | `{ tenantId, auctionId }`                                     | Leave auction room                  |
| `PLACE_BID`     | `{ tenantId, auctionId, auctionItemId, amount, clientBidId }` | Place a bid                         |
| `PING`          | `{}`                                                          | Keep-alive ping                     |

### Server → Client

| Event                    | Data                                    | Description                     |
| ------------------------ | --------------------------------------- | ------------------------------- |
| `CONNECTED`              | `{ message, email }`                    | Initial connection confirmation |
| `HELLO_OK`               | `{ ok, user }`                          | Handshake complete              |
| `JOINED`                 | `{ room, auctionId, participantCount }` | Successfully joined room        |
| `LEFT`                   | `{ room, auctionId }`                   | Left room                       |
| `BID_PLACED`             | `BidPlacedData`                         | New bid placed (broadcast)      |
| `BID_REJECTED`           | `{ reason, code }`                      | Bid rejected                    |
| `AUCTION_STATUS_CHANGED` | `{ status, auction }`                   | Auction status changed          |
| `AUCTION_TIME_EXTENDED`  | `{ newEndTime, extensionMinutes }`      | Soft-close extension            |
| `PARTICIPANT_COUNT`      | `{ auctionId, count }`                  | Participant count updated       |
| `ERROR`                  | `{ code, message }`                     | Error occurred                  |
| `PONG`                   | `{}`                                    | Keep-alive response             |

### BidPlacedData Structure

```typescript
interface BidPlacedData {
  tenantId: string;
  auctionId: string;
  auctionItemId: string;
  bidId: string;
  amount: number;
  userId: string;
  userName: string;
  timestamp: number;
  item: {
    id: string;
    plate?: string;
    brand?: string;
    model?: string;
  };
}
```

---

## Backend Implementation

### 1. WS Auth Adapter

**Purpose:** Custom WebSocket adapter with JWT authentication

**Key Features:**

- Validates JWT during HTTP upgrade
- Removes NestJS's default unauthenticated handler
- Attaches user to WebSocket instance
- Supports multiple token sources

**Critical Methods:**

- `create()` - Strips namespace property to avoid errors
- `bindClientConnect()` - Overrides upgrade handler with authentication
- `bindAuthenticationAfterInit()` - Binds auth AFTER server starts
- `extractToken()` - Extracts JWT from query/header/cookie

### 2. Realtime Gateway

**Purpose:** Base gateway with connection lifecycle management

**Features:**

- HELLO handshake handler
- Ping/pong heartbeat (30s interval)
- Connection tracking
- Helper methods for messaging

**Key Methods:**

```typescript
handleConnection(client: WebSocket)
handleDisconnect(client: WebSocket)
handleHello(client: WebSocket, data: any)
sendMessage(client: WebSocket, message: any)
broadcastToRoom(roomKey: string, message: any)
```

### 3. Auctions Gateway

**Purpose:** Auction-specific WebSocket logic

**Features:**

- Room management (one room per auction)
- JOIN_AUCTION / LEAVE_AUCTION handlers
- PLACE_BID with Prisma transactions
- Bid validation (amount, role, tenant)
- Soft-close time extension
- Broadcast bid updates

**Key Methods:**

```typescript
handleJoinAuction(client, data);
handleLeavAuction(client, data);
handlePlaceBid(client, data);
emitBidPlaced(tenantId, auctionId, bidData);
emitAuctionStatusChange(tenantId, auctionId, status, auction);
```

---

## Frontend Implementation

### 1. WebSocket Client (Singleton)

**File:** `apps/frontend/src/lib/ws-client.ts`

**Features:**

- Singleton pattern (one connection per app)
- Automatic reconnection with exponential backoff
- Heartbeat to keep connection alive
- Message routing to subscribers
- Connection state management

**Usage:**

```typescript
import { wsClient } from '@/lib/ws-client';

// Connect
await wsClient.connect(token);

// Subscribe to messages
const unsubscribe = wsClient.subscribe((message) => {
  console.log('Received:', message);
});

// Send message
wsClient.send({ event: 'PLACE_BID', data: { ... } });

// Disconnect
wsClient.disconnect();
```

### 2. useAuctionWebSocket Hook

**File:** `apps/frontend/src/hooks/use-auction-websocket.ts`

**Features:**

- Auto-connects and joins auction room
- Manages bid state
- Provides `placeBid` function
- Tracks participant count
- Handles errors and connection state

**Usage:**

```typescript
const {
  connectionState, // 'CONNECTING' | 'CONNECTED' | 'AUTHENTICATED' | 'DISCONNECTED' | 'ERROR'
  isConnected, // boolean
  isAuthenticated, // boolean
  bids, // BidPlacedData[]
  participantCount, // number
  placeBid, // (itemId, amount) => void
  connect, // () => Promise<void>
  disconnect, // () => void
  error, // string | null
} = useAuctionWebSocket({
  tenantId: 'xxx',
  auctionId: 'yyy',
  enabled: true, // optional, default true
});
```

### 3. UI Components

**Auction Active Bidding View:**

- Real-time bid updates
- Live participant count
- Connection status indicator
- Automatic bidding feature
- Self-bid warning dialog

**Features:**

- WebSocket connection with ref pattern (prevents infinite loops)
- Auto-bid logic with cookie persistence
- Soft-close time extension display
- Winner badges for completed auctions

---

## Integration Guide

### 1. Integrate with Bid Service

**File:** `apps/backend/src/modules/app-modules/bids/services/bid.service.ts`

```typescript
import { AuctionsGateway } from '@/modules/providers-modules/realtime/auctions.gateway';

@Injectable()
export class BidService {
  constructor(
    private readonly bidRepository: BidPrismaRepository,
    private readonly auctionsGateway: AuctionsGateway,
  ) {}

  async createBid(data: CreateBidDto) {
    const bid = await this.bidRepository.create(data);

    // Emit WebSocket event (REST API bids also broadcast)
    this.auctionsGateway.emitBidPlaced(data.tenantId, data.auctionId, {
      tenantId: data.tenantId,
      auctionId: data.auctionId,
      auctionItemId: data.auctionItemId,
      bidId: bid.id,
      amount: Number(bid.offered_price),
      userId: data.userId,
      userName: bid.user?.public_name || 'Participante',
      timestamp: bid.bid_time.getTime(),
      item: { ... },
    });

    return bid;
  }
}
```

### 2. Integrate with Auction Service

```typescript
@Injectable()
export class AuctionService {
  constructor(private readonly auctionRepository: AuctionPrismaRepository, private readonly auctionsGateway: AuctionsGateway) {}

  async updateAuctionStatus(tenantId, auctionId, status) {
    const auction = await this.auctionRepository.update(auctionId, { status });

    // Broadcast status change
    this.auctionsGateway.emitAuctionStatusChange(tenantId, auctionId, status, auction);

    return auction;
  }
}
```

### 3. Update Module Imports

```typescript
// bids.module.ts & auctions.module.ts
import { RealtimeModule } from '@/modules/providers-modules/realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  // ...
})
```

---

## Testing

### Node.js Test Script

```bash
node tools/test-websocket.js <jwt-token> <tenant-id> <auction-id> <item-id>
```

### Browser Console Test

```javascript
const token = document.cookie
  .split(';')
  .find((c) => c.includes('accessToken'))
  ?.split('=')[1];
const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);

ws.onopen = () => {
  ws.send(JSON.stringify({ event: 'HELLO', data: {} }));
  ws.send(
    JSON.stringify({
      event: 'JOIN_AUCTION',
      data: { tenantId: 'xxx', auctionId: 'yyy' },
    })
  );
};

ws.onmessage = (e) => console.log('📥', JSON.parse(e.data));
```

### Expected Logs

**Backend:**

```
[WsAuthAdapter] WebSocket upgrade authenticated: nico@test.cl
[RealtimeGateway] Client connected: nico@test.cl (role: USER)
[RealtimeGateway] HELLO received from nico@test.cl
[AuctionsGateway] nico@test.cl joined auction xxx (5 participants)
```

**Frontend:**

```
🔄 Connecting to WebSocket server...
✅ WebSocket connection opened
📤 Sending HELLO message...
📥 Received: CONNECTED
📥 Received: HELLO_OK
✅ Handshake complete - AUTHENTICATED
```

---

## Deployment

### Environment Variables

**Backend (.env.production):**

```env
JWT_SECRET=<production-secret>
JWT_ACCESS_EXPIRY_TIME=15m
PORT=3001
NODE_ENV=production
DATABASE_URL=<production-database-url>
```

**Frontend (.env.production):**

```env
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Railway Deployment

```bash
railway up
railway logs

# Test
wscat -c "wss://your-backend.railway.app/ws?token=<jwt-token>"
```

### Vercel Deployment

```bash
vercel --prod

# Or push to main (auto-deploy)
git push origin main
```

### Load Balancer (NGINX)

```nginx
upstream backend {
    ip_hash;  # Sticky sessions required!
    server backend1:3001;
    server backend2:3001;
}

server {
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

---

## Troubleshooting

### Connection Rejected (401)

- ✅ Check JWT token is valid and not expired
- ✅ Verify JWT_SECRET matches between auth service and WebSocket
- ✅ Check token is being sent correctly

### Messages Not Received

- ✅ Verify client has joined the auction room (JOIN_AUCTION)
- ✅ Check auction exists and is active
- ✅ Verify tenantId matches user's tenant

### Infinite Loop (200+ Connections)

- ✅ Use refs for callback functions in useEffect
- ✅ Don't include `refetch` in dependency array
- ✅ Pattern: `const refetchRef = useRef(refetch); refetchRef.current = refetch;`

### Heartbeat Timeouts

- ✅ Check network stability
- ✅ Verify ping/pong handlers are working
- ✅ Adjust heartbeat interval if needed (currently 30s)

---

## Error Codes

| Code                | Meaning               | Solution                |
| ------------------- | --------------------- | ----------------------- |
| `UNAUTHORIZED`      | No/invalid token      | Check JWT token         |
| `FORBIDDEN`         | Wrong tenant/role     | Verify user permissions |
| `AUCTION_NOT_FOUND` | Auction doesn't exist | Check auction ID        |
| `AUCTION_CLOSED`    | Auction not active    | Check auction status    |
| `BID_TOO_LOW`       | Bid below minimum     | Increase bid amount     |
| `RATE_LIMIT`        | Too many requests     | Wait before retrying    |
| `INTERNAL_ERROR`    | Server error          | Check server logs       |

---

## Best Practices

1. **Always check `isAuthenticated` before sending messages**
2. **Handle errors gracefully with user feedback**
3. **Show connection status to users**
4. **Clean up on component unmount**
5. **Throttle bid placement (1 bid per second)**
6. **Use refs to prevent infinite loops in useEffect**
7. **Implement fallback to REST API when WebSocket unavailable**

---

## Key Learnings

1. **NestJS lifecycle matters** - HTTP server isn't available during module initialization
2. **Timing is everything** - Bind authentication AFTER `app.listen()`
3. **NestJS adds hidden properties** - Strip out `namespace` to avoid errors
4. **Override carefully** - Remove existing handlers before adding your own
5. **Native WebSocket is simpler** - No Socket.io overhead
6. **Double handshake is secure** - Upgrade auth + HELLO message = robust authentication
7. **Refs prevent loops** - Use refs for callbacks in useEffect dependencies

---

---

## Auction-Specific Implementation

### Room-Based Architecture

The auction WebSocket system uses **room-based architecture** where each auction has its own isolated room:

- **Room Key Format**: `${tenantId}:${auctionId}`
- **Multi-tenant Isolation**: Each tenant's auctions are completely isolated
- **Participant Tracking**: Real-time count of connected users per auction
- **Broadcast Capabilities**: Messages can be sent to all participants in a room

### AuctionsGateway

**File:** `apps/backend/src/modules/providers-modules/realtime/auctions.gateway.ts`

**Features:**

- ✅ JWT authentication (inherited from WsAuthAdapter)
- ✅ HELLO handshake for connection verification
- ✅ JOIN_AUCTION - Join an auction room
- ✅ LEAVE_AUCTION - Leave an auction room
- ✅ PLACE_BID - Place a bid with validation
- ✅ Participant count tracking
- ✅ Heartbeat/ping-pong for connection health
- ✅ Automatic room cleanup when empty

**Public Methods:**

```typescript
broadcastToRoom(roomKey: string, message: WsServerMessage)
broadcastToRoomExcept(roomKey: string, message: WsServerMessage, excludeClient: WebSocket)
getRoomClients(tenantId: string, auctionId: string): WebSocket[]
getParticipantCount(tenantId: string, auctionId: string): number
getActiveRooms(): Array<{ tenantId: string; auctionId: string; count: number }>
```

### BidRealtimeService

**File:** `apps/backend/src/modules/app-modules/bids/services/bid-realtime.service.ts`

**Features:**

- ✅ Bid validation (amount, auction status, user registration)
- ✅ Bid persistence to database with Prisma transactions
- ✅ Real-time broadcast to all auction participants
- ✅ Soft-close time extension (30s threshold, 2min extension)
- ✅ Bid history retrieval
- ✅ Auction status change broadcasting

**Bid Validation Rules:**

1. Auction must exist and belong to the tenant
2. Auction status must be `ACTIVA`
3. Current time must be between `startTime` and `endTime`
4. Bid amount must be >= highest bid + bidIncrement (or startingBid if no bids)
5. User must be registered for the auction (AuctionRegistration)
6. Only USER role can place bids

**Soft-Close Logic:**

```typescript
// If bid placed within 30 seconds of auction end
if (timeUntilEnd <= 30000) {
  // Extend auction by 2 minutes
  auction.endTime = new Date(auction.endTime.getTime() + 120000);

  // Broadcast time extension
  this.auctionsGateway.broadcastToRoom(roomKey, {
    event: 'AUCTION_TIME_EXTENDED',
    data: {
      auctionId,
      newEndTime: auction.endTime,
      extensionMinutes: 2,
    },
  });
}
```

---

## Auction Status Management

### Status Flow

```
PENDIENTE → ACTIVA → COMPLETADA
    ↓          ↓
CANCELADA  CANCELADA
```

**Status Definitions:**

- **PENDIENTE**: Auction created, waiting for `startTime`
- **ACTIVA**: Auction is live, accepting bids
- **COMPLETADA**: Auction ended naturally at `endTime`
- **CANCELADA**: Auction manually cancelled by AUCTION_MANAGER
- **ELIMINADA**: Soft-deleted auction

### Smart Scheduler

**File:** `apps/backend/src/modules/app-modules/auctions/services/auction-status-scheduler.service.ts`

**Features:**

1. **Adaptive Polling**

   - Default: 30 seconds
   - Urgent: 5 seconds (when auction starts/ends within 2 minutes)
   - Automatically adjusts based on upcoming events

2. **Automatic Transitions**

   - `PENDIENTE → ACTIVA`: When `startTime` is reached
   - `ACTIVA → COMPLETADA`: When `endTime` is reached

3. **WebSocket Broadcasting**
   - Notifies all connected clients in the auction room
   - Real-time status updates without page refresh

**Algorithm:**

```typescript
// Check every 30 seconds by default
defaultInterval: 30000;

// Check every 5 seconds if auction starts/ends within 2 minutes
urgentInterval: 5000;
urgentThreshold: 120000; // 2 minutes
```

**Process:**

1. Query database for auctions starting/ending soon
2. If any found → use `urgentInterval` (5s)
3. If none → use `defaultInterval` (30s)
4. Update statuses and broadcast via WebSocket
5. Schedule next check

**Lifecycle:**

- **Starts**: Automatically when backend starts (`onModuleInit`)
- **Stops**: Automatically when backend stops (`onModuleDestroy`)
- **Manual Trigger**: `triggerManualCheck()` for testing

### Manual Status Changes

**Cancel Auction:**

- **Endpoint**: `POST /auctions/:id/cancel`
- **Authorization**: `AUCTION_MANAGER` only
- **Can cancel**: `PENDIENTE` or `ACTIVA`
- **Cannot cancel**: `COMPLETADA`, `ELIMINADA`, already `CANCELADA`
- **Side Effects**: Updates DB, creates audit log, broadcasts via WebSocket

**Status Change Event:**

```typescript
{
  event: 'AUCTION_STATUS_CHANGED',
  data: {
    auctionId: string;
    status: 'PENDIENTE' | 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
    auction?: Auction;
    timestamp: string;
  }
}
```

---

## User Bidding Interface

### Role-Based Routing

```
AuctionViewRouter
├── AUCTION_MANAGER → AuctionDetail (management view)
└── USER → Status-based routing:
    ├── PENDIENTE → AuctionPendingView
    ├── ACTIVA → AuctionActiveBiddingView (WebSocket)
    ├── COMPLETADA → AuctionCompletedView
    └── CANCELADA → Alert message
```

### AuctionActiveBiddingView

**File:** `apps/frontend/src/components/auctions/user-view/auction-active-bidding-view.tsx`

**Features:**

- ✅ Real-time WebSocket connection with ref pattern (prevents infinite loops)
- ✅ Per-item bid inputs with validation
- ✅ Live bid history updates
- ✅ Connection status indicator
- ✅ Participant count display
- ✅ Automatic bidding with confirmation button
- ✅ Self-bid warning dialog
- ✅ Winner badges for completed auctions
- ✅ Soft-close time extension display

**Automatic WebSocket Connection:**

```typescript
useEffect(() => {
  const ws = new WebSocket(`${wsEndpoint}?token=${accessToken}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ event: 'HELLO', data: {} }));
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.event === 'HELLO_OK') {
      ws.send(
        JSON.stringify({
          event: 'JOIN_AUCTION',
          data: { tenantId, auctionId },
        })
      );
    }
  };

  return () => ws.close(); // Auto-cleanup
}, []);
```

**Preventing Infinite Loops:**

```typescript
// Use refs for callbacks to prevent infinite loops
const refetchRef = useRef(refetch);

useEffect(() => {
  refetchRef.current = refetch;
}, [refetch]);

// In WebSocket message handler
if (msg.event === 'BID_PLACED') {
  refetchRef.current(); // Won't trigger useEffect
}
```

### Per-Item Bidding

Each auction item displays:

- **Base Price** (from `startingBid` column)
- **Current Highest Bid**
- **Minimum Next Bid** = Current + Increment
- **Bid Input** with validation
- **Bid History** (last 10 bids)
- **Winning Indicator** (if user is winning)

### Automatic Bidding

**Features:**

- Set maximum price willing to pay
- Confirmation button before activation
- Cookie-based persistence (7-day expiration)
- Auto-counter-bids when others bid
- Stops when max price reached
- 1-second delay for natural feel

**UI Flow:**

1. User enters max price
2. Clicks "Activar Puja Automática" button
3. Settings saved to cookies
4. System auto-bids when others bid
5. Green badge shows "✓ Activa"
6. "Desactivar" button to turn off

**Logic:**

```typescript
// Listen to BID_PLACED events
if (bidderId !== userId) {
  const autoBid = autoBidSettings[auctionItemId];
  if (autoBid?.enabled && autoBid.maxPrice) {
    const nextBidAmount = amount + Number(auction.bidIncrement);

    if (nextBidAmount <= autoBid.maxPrice) {
      setTimeout(() => {
        wsRef.current.send(
          JSON.stringify({
            event: 'PLACE_BID',
            data: { tenantId, auctionId, auctionItemId, amount: nextBidAmount },
          })
        );
      }, 1000);
    }
  }
}
```

### Self-Bid Warning

Shows confirmation dialog when user tries to outbid themselves:

```typescript
if (currentHighestBid?.userId === userId) {
  setSelfBidWarning({ auctionItemId, amount });
  return; // Show dialog
}
```

### Visual Feedback

**Connection Status:**

- 🟢 Green badge: "En vivo" when connected
- 🔴 Gray badge: "Sin conexión" when disconnected
- Live participant count

**Bid Status:**

- ⏳ Pending: "Pujando..." with spinner
- ✅ Success: Updates bid history, clears pending
- ❌ Error: Shows error message

**Winning Status:**

- 🏆 Yellow badge: "¡Ganaste!" for won items in completed auctions
- Green badge: "Ganando" if user has highest bid in active auction

---

## Complete Message Reference

### All Client → Server Messages

| Event           | Data                                                          | Description                         |
| --------------- | ------------------------------------------------------------- | ----------------------------------- |
| `HELLO`         | `{}`                                                          | Complete handshake after connection |
| `JOIN_AUCTION`  | `{ tenantId, auctionId }`                                     | Join auction room                   |
| `LEAVE_AUCTION` | `{ tenantId, auctionId }`                                     | Leave auction room                  |
| `PLACE_BID`     | `{ tenantId, auctionId, auctionItemId, amount, clientBidId }` | Place a bid                         |
| `PING`          | `{}`                                                          | Keep-alive ping                     |

### All Server → Client Messages

| Event                    | Data                                    | Description                     |
| ------------------------ | --------------------------------------- | ------------------------------- |
| `CONNECTED`              | `{ message, email }`                    | Initial connection confirmation |
| `HELLO_OK`               | `{ ok, user }`                          | Handshake complete              |
| `JOINED`                 | `{ room, auctionId, participantCount }` | Successfully joined room        |
| `LEFT`                   | `{ room, auctionId }`                   | Left room                       |
| `BID_PLACED`             | `BidPlacedData`                         | New bid placed (broadcast)      |
| `BID_REJECTED`           | `{ reason, code }`                      | Bid rejected                    |
| `AUCTION_STATUS_CHANGED` | `{ status, auction, timestamp }`        | Auction status changed          |
| `AUCTION_TIME_EXTENDED`  | `{ newEndTime, extensionMinutes }`      | Soft-close extension            |
| `PARTICIPANT_COUNT`      | `{ auctionId, count }`                  | Participant count updated       |
| `ERROR`                  | `{ code, message }`                     | Error occurred                  |
| `PONG`                   | `{}`                                    | Keep-alive response             |

---

## Complete Testing Guide

### Backend Tests

**Start Backend:**

```bash
pnpm nx serve backend
```

**Expected Logs:**

```
[WsAuthAdapter] WsAuthAdapter initialized with JWT authentication
[WsAuthAdapter] Setting up authenticated WebSocket connections
[WsAuthAdapter] Binding authentication after application init
[WsAuthAdapter] Removing 1 existing upgrade listeners
Server running on http://localhost:3001
[AuctionStatusSchedulerService] 🚀 Auction Status Scheduler initialized
```

### Frontend Tests

**Start Frontend:**

```bash
pnpm nx serve frontend
```

**Test Scenarios:**

1. **Connection Test**

   - Log in as USER
   - Navigate to active auction
   - Should see "En vivo" badge
   - Should see participant count

2. **Bidding Test**

   - Enter amount >= minimum
   - Click "Pujar"
   - Should show "Pujando..."
   - Should update bid history
   - Other tabs should update instantly

3. **Auto-Bid Test**

   - Enter max price
   - Click "Activar Puja Automática"
   - Open second tab
   - Place bid in second tab
   - First tab should auto-counter-bid

4. **Self-Bid Test**

   - Place highest bid
   - Try to bid again
   - Should show confirmation dialog

5. **Status Change Test**
   - Wait for auction to end
   - Should see status change to COMPLETADA
   - Should show winner badges

### Node.js Test Script

```bash
node tools/test-websocket.js <jwt-token> <tenant-id> <auction-id> <item-id>
```

### Browser Console Test

```javascript
const token = document.cookie
  .split(';')
  .find((c) => c.includes('accessToken'))
  ?.split('=')[1];
const ws = new WebSocket(`ws://localhost:3001/ws?token=${token}`);

ws.onopen = () => {
  ws.send(JSON.stringify({ event: 'HELLO', data: {} }));
  ws.send(
    JSON.stringify({
      event: 'JOIN_AUCTION',
      data: { tenantId: 'xxx', auctionId: 'yyy' },
    })
  );
};

ws.onmessage = (e) => console.log('📥', JSON.parse(e.data));

// Place bid
ws.send(
  JSON.stringify({
    event: 'PLACE_BID',
    data: {
      tenantId: 'xxx',
      auctionId: 'yyy',
      auctionItemId: 'zzz',
      amount: 100000,
      clientBidId: `test-${Date.now()}`,
    },
  })
);
```

---

**This is the complete, working foundation for the Suba&Go real-time auction system!** 🎉
