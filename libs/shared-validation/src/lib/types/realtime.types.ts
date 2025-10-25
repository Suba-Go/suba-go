/**
 * @file realtime.types.ts
 * @description WebSocket message contracts for realtime communication
 * Shared between frontend and backend for type-safe WebSocket messaging
 * @author Suba&Go
 */

/**
 * Client-to-Server messages
 */
export type WsClientMessage =
  | { event: 'HELLO'; data: { clientInfo?: any } }
  | { event: 'JOIN_AUCTION'; data: { tenantId: string; auctionId: string } }
  | { event: 'LEAVE_AUCTION'; data: { tenantId: string; auctionId: string } }
  | {
      event: 'PLACE_BID';
      data: {
        tenantId: string;
        auctionId: string;
        auctionItemId: string;
        amount: number;
        requestId: string;
      };
    }
  | { event: 'PING'; data: Record<string, never> };

/**
 * Server-to-Client messages
 */
export type WsServerMessage =
  | { event: 'CONNECTED'; data: { message: string; email: string } }
  | {
      event: 'HELLO_OK';
      data: {
        ok: true;
        user: {
          email: string;
          role: string;
          userId?: string;
          tenantId?: string;
        };
      };
    }
  | {
      event: 'JOINED';
      data: { room: string; auctionId: string; participantCount: number };
    }
  | { event: 'LEFT'; data: { room: string; auctionId: string } }
  | { event: 'KICKED_DUPLICATE'; data: { room: string; reason: string } }
  | { event: 'BID_PLACED'; data: BidPlacedData }
  | { event: 'BID_REJECTED'; data: { reason: string; code: string } }
  | { event: 'AUCTION_STATUS_CHANGED'; data: AuctionStatusData }
  | { event: 'AUCTION_TIME_EXTENDED'; data: AuctionTimeExtendedData }
  | { event: 'AUCTION_ENDED'; data: { auctionId: string; tenantId: string } }
  | { event: 'PARTICIPANT_COUNT'; data: { auctionId: string; count: number } }
  | { event: 'ERROR'; data: { code: string; message: string } }
  | { event: 'PONG'; data: Record<string, never> };

/**
 * Bid placed event data
 */
export interface BidPlacedData {
  tenantId: string;
  auctionId: string;
  auctionItemId: string;
  bidId: string;
  amount: number;
  userId: string;
  userName?: string;
  timestamp: number;
  requestId: string; // echo back for client correlation
  item?: {
    id: string;
    plate?: string;
    brand?: string;
    model?: string;
  };
}

/**
 * Auction status changed event data
 */
export interface AuctionStatusData {
  auctionId: string;
  tenantId?: string;
  status: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  auction?: any; // Full auction object (optional)
  timestamp?: string;
}

/**
 * Auction time extended event data (soft-close)
 */
export interface AuctionTimeExtendedData {
  auctionId: string;
  newEndTime: string;
  extensionSeconds: number;
}

/**
 * WebSocket connection state
 */
export enum WsConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATED = 'AUTHENTICATED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

/**
 * WebSocket error codes
 */
export enum WsErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  AUCTION_NOT_FOUND = 'AUCTION_NOT_FOUND',
  AUCTION_CLOSED = 'AUCTION_CLOSED',
  INVALID_BID = 'INVALID_BID',
  BID_TOO_LOW = 'BID_TOO_LOW',
  NOT_REGISTERED = 'NOT_REGISTERED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
