# Bids Module

## Overview

The Bids module handles all bid-related functionality in the Suba&Go auction system. It provides real-time bid placement via WebSocket with server-authoritative validation.

## Architecture

### Services

#### 1. **BidRealtimeService** (`services/bid-realtime.service.ts`)

**Purpose**: Handles real-time bid operations with WebSocket integration

**Key Responsibilities:**

- Place bids with full validation (auction status, bid amount, user registration)
- Broadcast bid events to all auction participants via WebSocket
- Validate user access and permissions
- Ensure data consistency with database transactions

**Key Methods:**

- `placeBid(auctionItemId, amount, userId, tenantId)` - Place a bid and broadcast to room
- `broadcastAuctionStatusChange(auctionId, tenantId, status)` - Notify participants of status changes

**Dependencies:**

- `BidPrismaService` - Database operations
- `AuctionsGateway` - WebSocket broadcasting
- `PrismaService` - Direct database access for complex queries

---

#### 2. **BidPrismaService** (`services/bid-prisma.service.ts`)

**Purpose**: Repository service for bid database operations

**Key Responsibilities:**

- CRUD operations for bids
- Query bids by various criteria (auction, item, user)
- Validate bid amounts
- Calculate bid statistics

**Key Methods:**

- `createBid(data)` - Create a new bid
- `findBidsByAuctionItem(auctionItemId)` - Get all bids for an item
- `findBidsByAuction(auctionId)` - Get all bids for an auction
- `findBidsByUser(userId, tenantId)` - Get user's bids
- `findHighestBidForItem(auctionItemId)` - Get current highest bid
- `validateBidAmount(auctionItemId, bidAmount)` - Validate bid meets minimum requirements
- `getBidStats(tenantId)` - Get bid statistics for a tenant

---

## Data Flow

### Placing a Bid (WebSocket)

```
1. User clicks "Pujar" button in frontend
   ↓
2. Frontend sends PLACE_BID WebSocket message
   {
     event: 'PLACE_BID',
     data: {
       tenantId: 'xxx',
       auctionId: 'xxx',
       auctionItemId: 'xxx',
       amount: 1000000
     }
   }
   ↓
3. AuctionsGateway.handlePlaceBid() validates:
   - User is authenticated
   - User has USER role
   - User belongs to tenant
   - User is in auction room
   ↓
4. BidRealtimeService.placeBid() validates:
   - Auction exists and is ACTIVA
   - Auction time is valid (between startTime and endTime)
   - Bid amount meets minimum (highest + increment)
   - User is registered for auction
   ↓
5. BidPrismaService creates bid in database
   ↓
6. AuctionsGateway broadcasts BID_PLACED to ALL participants
   {
     event: 'BID_PLACED',
     data: {
       bidId: 'xxx',
       auctionItemId: 'xxx',
       amount: 1000000,
       userId: 'xxx',
       userName: 'John Doe',
       timestamp: 1234567890
     }
   }
   ↓
7. All connected clients receive update and refresh UI
```

---

## Validation Rules

### Bid Placement Validation

1. **Auction Status**: Must be `ACTIVA`
2. **Auction Time**: Current time must be between `startTime` and `endTime`
3. **Bid Amount**: Must be at least `currentHighest + bidIncrement`
4. **User Registration**: User must be registered for the auction (in `AuctionRegistration` table)
5. **Tenant Access**: User must belong to the same tenant as the auction
6. **Role**: Only users with `USER` role can place bids

---

## Database Schema

### Bid Table

```prisma
model Bid {
  id             String       @id @default(uuid())
  offered_price  Decimal      @db.Decimal(10, 2)
  bid_time       DateTime
  userId         String
  auctionId      String
  auctionItemId  String
  tenantId       String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  isDeleted      Boolean      @default(false)
  deletedAt      DateTime?

  user           User         @relation(fields: [userId], references: [id])
  auction        Auction      @relation(fields: [auctionId], references: [id])
  auctionItem    AuctionItem  @relation(fields: [auctionItemId], references: [id])
  tenant         Tenant       @relation(fields: [tenantId], references: [id])
}
```

---

## WebSocket Events

### Outgoing Events (Server → Client)

#### `BID_PLACED`

Broadcast when a bid is successfully placed.

```typescript
{
  event: 'BID_PLACED',
  data: {
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
}
```

#### `BID_REJECTED`

Sent to the bidder when their bid is rejected.

```typescript
{
  event: 'ERROR',
  data: {
    code: 'BID_REJECTED',
    message: string;
  }
}
```

---

## Error Handling

### Common Errors

| Error               | Code                  | Reason                                |
| ------------------- | --------------------- | ------------------------------------- |
| Item not found      | `NotFoundException`   | `auctionItemId` doesn't exist         |
| Forbidden access    | `ForbiddenException`  | User doesn't belong to tenant         |
| Auction not active  | `BadRequestException` | Auction status is not `ACTIVA`        |
| Auction not started | `BadRequestException` | Current time < `startTime`            |
| Auction ended       | `BadRequestException` | Current time > `endTime`              |
| Bid too low         | `BadRequestException` | Bid < `currentHighest + bidIncrement` |
| Not registered      | `ForbiddenException`  | User not in `AuctionRegistration`     |

---

## Module Structure

```
apps/backend/src/modules/app-modules/bids/
├── services/
│   ├── bid-prisma.service.ts      # Database repository
│   └── bid-realtime.service.ts    # Real-time bid logic
├── bids.module.ts                 # Module definition
└── README.md                      # This file
```

---

## Dependencies

### Internal Modules

- `PrismaModule` - Database access
- `RealtimeModule` - WebSocket gateway access

### External Packages

- `@nestjs/common` - NestJS core
- `@prisma/client` - Database ORM
- `@suba-go/shared-validation` - Shared types and validation

---

## Future Enhancements

### Planned Features

- [ ] Soft-close extension (extend auction time when bid placed near end)
- [ ] Bid retraction (allow users to cancel bids under certain conditions)
- [ ] Proxy bidding (automatic bidding up to a maximum amount)
- [ ] Bid history pagination
- [ ] Bid notifications (email/SMS when outbid)
- [ ] Bid analytics dashboard

## Notes

- All bids are **server-authoritative** - validation happens on the backend
- Bids are processed in **FIFO order** based on server arrival time
- WebSocket provides **instant feedback** to all participants
- Database transactions ensure **data consistency**
- Soft deletes are used (bids are never physically deleted)

---

**Last Updated**: 2025-10-23
**Maintainer**: Suba&Go Team
