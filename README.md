# Suba&Go Documentation

**Last Updated:** 2025-10-23

---

## 📖 Complete WebSocket Guide

**All documentation is now consolidated in a single comprehensive guide:**

### **[WEBSOCKET_COMPLETE_GUIDE.md](./WEBSOCKET_COMPLETE_GUIDE.md)**

This guide contains everything you need to know about the Suba&Go real-time auction system:

#### 📚 Contents

1. **Quick Start** - Get up and running in minutes
2. **Architecture Overview** - System design and components
3. **Authentication** - JWT-based WebSocket authentication
4. **Message Protocol** - Complete message reference
5. **Backend Implementation** - NestJS gateways and services
6. **Frontend Implementation** - React hooks and components
7. **Auction-Specific Features** - Room-based architecture, bidding, soft-close
8. **Auction Status Management** - Smart scheduler and automatic transitions
9. **User Bidding Interface** - Real-time bidding UI with auto-bid
10. **Integration Guide** - How to integrate with existing services
11. **Deployment** - Production deployment checklist
12. **Troubleshooting** - Common issues and solutions

---

## 🚀 Quick Start

### Backend

```bash
pnpm nx serve backend
# WebSocket available at: ws://localhost:3001/ws
```

### Frontend

```typescript
import { useAuctionWebSocket } from '@/hooks/use-auction-websocket';

const { bids, placeBid, isAuthenticated } = useAuctionWebSocket({
  tenantId: 'tenant-id',
  auctionId: 'auction-id',
});
```

---

## ✨ Key Features

### ✅ Implemented

- **Real-Time Bidding** - WebSocket-based live bidding with instant updates
- **Double Handshake Authentication** - HTTP upgrade + HELLO message for security
- **Room-Based Architecture** - Isolated auction rooms with participant tracking
- **Soft-Close Extension** - Automatic time extension on last-minute bids (30s threshold, 2min extension)
- **Automatic Status Management** - Smart scheduler transitions auctions between states
- **Role-Based Views** - Different interfaces for USER vs AUCTION_MANAGER
- **Automatic Bidding** - Set max price and auto-counter-bid with confirmation
- **Self-Bid Warning** - Confirmation dialog when user tries to outbid themselves
- **Online Status Badges** - Show which participants are connected (for managers)
- **Winner Indicators** - Trophy badges and highlights for won items
- **Connection Status** - Visual indicators for WebSocket connection state
- **Automatic Reconnection** - Exponential backoff reconnection strategy
- **Multi-Tenant Isolation** - Complete tenant separation at all levels

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  • AuctionViewRouter (role-based routing)                   │
│  • AuctionActiveBiddingView (USER real-time bidding)        │
│  • AuctionDetail (AUCTION_MANAGER management)               │
│  • useAuctionWebSocket hook                                 │
│  • wsClient (singleton WebSocket manager)                   │
└─────────────────────────────────────────────────────────────┘
                              ↕ WebSocket (wss://)
┌─────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                        │
├─────────────────────────────────────────────────────────────┤
│  • WsAuthAdapter (JWT authentication)                       │
│  • RealtimeGateway (base WebSocket logic)                   │
│  • AuctionsGateway (auction rooms & bidding)                │
│  • BidRealtimeService (bid validation & persistence)        │
│  • AuctionStatusScheduler (automatic status updates)        │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  • Auctions, AuctionItems, Bids                             │
│  • Users, Tenants, Companies                                │
│  • Multi-tenant isolation                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Message Protocol

### Client → Server

- `HELLO` - Complete handshake
- `JOIN_AUCTION` - Join auction room
- `PLACE_BID` - Place a bid
- `LEAVE_AUCTION` - Leave auction room
- `PING` - Keep-alive

### Server → Client

- `HELLO_OK` - Handshake complete
- `JOINED` - Successfully joined room
- `BID_PLACED` - New bid placed (broadcast)
- `AUCTION_STATUS_CHANGED` - Status changed
- `AUCTION_TIME_EXTENDED` - Soft-close extension
- `PARTICIPANT_COUNT` - Participant count updated
- `BID_REJECTED` - Bid rejected
- `ERROR` - Error occurred

---

## 🔐 Environment Variables

### Backend

```env
JWT_SECRET=your-secret-key
PORT=3001
DATABASE_URL=postgresql://...
```

### Frontend

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🐛 Common Issues

### Connection Rejected (401)

- Check JWT token is valid and not expired
- Verify JWT_SECRET matches between services

### Messages Not Received

- Verify client has joined the auction room
- Check auction exists and is active

### Infinite Loop (200+ Connections)

- Use refs for callback functions in useEffect
- Pattern: `const refetchRef = useRef(refetch); refetchRef.current = refetch;`

## 🎯 Best Practices

1. **Always check `isAuthenticated` before sending WebSocket messages**
2. **Handle errors gracefully with user feedback**
3. **Show connection status to users**
4. **Clean up WebSocket connections on component unmount**
5. **Throttle bid placement (1 bid per second)**
6. **Use refs to prevent infinite loops in useEffect**
7. **Implement fallback to REST API when WebSocket unavailable**

---

## 🆘 Support

**For questions or issues:**

1. Read the [Complete WebSocket Guide](./WEBSOCKET_COMPLETE_GUIDE.md)
2. Check the troubleshooting section
3. Review browser console and server logs

**Key Files:**

- Backend: `apps/backend/src/modules/providers-modules/realtime/`
- Frontend: `apps/frontend/src/hooks/use-auction-websocket.ts`
- Frontend: `apps/frontend/src/lib/ws-client.ts`

---

**Happy coding! 🚀**
