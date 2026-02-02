/**
 * @file use-auction-websocket.ts
 * @description React hook for auction WebSocket connection and bid handling
 * Manages auction room subscription and real-time bid updates
 * @author Suba&Go
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { wsClient } from '@/lib/ws-client';
import { WsConnectionState, type WsServerMessage, type BidPlacedData } from '@suba-go/shared-validation';

function createRequestId(): string {
  // Unique id for correlating PLACE_BID requests with BID_PLACED/BID_REJECTED responses.
  // (Used by the backend to echo back in realtime messages.)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    //  - TS lib may not include randomUUID depending on config
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface UseAuctionWebSocketOptions {
  tenantId: string;
  auctionId: string;
  enabled?: boolean; // Allow disabling the connection
}

interface UseAuctionWebSocketReturn {
  // Connection state
  connectionState: WsConnectionState;
  isConnected: boolean;
  isAuthenticated: boolean;

  // Bid data
  bids: BidPlacedData[];

  // Participant count
  participantCount: number;

  // Actions
  placeBid: (auctionItemId: string, amount: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;

  // Error state
  error: string | null;
}

/**
 * Hook to manage WebSocket connection for a specific auction
 * Automatically joins the auction room and handles bid updates
 */
export function useAuctionWebSocket({
  tenantId,
  auctionId,
  enabled = true,
}: UseAuctionWebSocketOptions): UseAuctionWebSocketReturn {
  const { data: session, status } = useSession();

  const [connectionState, setConnectionState] = useState<WsConnectionState>(
    wsClient.getState()
  );
  const [bids, setBids] = useState<BidPlacedData[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // Track an in-flight connect so we don't spam connect() calls.
  // IMPORTANT: do NOT block reconnects when the access token rotates.
  // The previous implementation used a boolean "connectionAttempted" which
  // prevented reconnecting with a *new* token after NextAuth refreshed it.
  const connectPromiseRef = useRef<Promise<void> | null>(null);

  const accessToken = (session as any)?.tokens?.accessToken as string | undefined;

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    // If we're already trying to connect, reuse that attempt.
    if (connectPromiseRef.current) return connectPromiseRef.current;

    try {
      if (!accessToken) {
        setError('No access token found (session not ready)');
        return;
      }

      connectPromiseRef.current = wsClient.connect(accessToken);
      await connectPromiseRef.current;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      connectPromiseRef.current = null;
    }
  }, [accessToken]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (hasJoinedRoom) {
      wsClient.leaveAuction(tenantId, auctionId);
      setHasJoinedRoom(false);
    }
    connectPromiseRef.current = null;
  }, [tenantId, auctionId, hasJoinedRoom]);

  /**
   * Join auction room after authentication
   */
  const joinAuctionRoom = useCallback(() => {
    if (!wsClient.isReady() || hasJoinedRoom) return;

    // Join the per-auction room so we only receive relevant realtime updates.
    wsClient.joinAuction(tenantId, auctionId);
    setHasJoinedRoom(true);
    setError(null);
  }, [tenantId, auctionId, hasJoinedRoom]);

  /**
   * Place a bid on an auction item
   */
  const placeBid = useCallback(
    (auctionItemId: string, amount: number) => {
      if (!wsClient.isReady()) {
        setError('Not connected to server');
        return;
      }

      const requestId = createRequestId();

      wsClient.send({
        event: 'PLACE_BID',
        data: {
          tenantId,
          auctionId,
          auctionItemId,
          amount,
          requestId,
        },
      });
    },
    [tenantId, auctionId]
  );

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = wsClient.onStateChange((state) => {
      setConnectionState(state);

      // Join room once authenticated
      if (state === 'AUTHENTICATED') {
        joinAuctionRoom();
      }

      // Reset join flag if disconnected
      if (state === 'DISCONNECTED' || state === 'ERROR') {
        setHasJoinedRoom(false);
      }
    });

    return unsubscribe;
  }, [joinAuctionRoom]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = wsClient.onMessage((message: WsServerMessage) => {
      switch (message.event) {
        case 'BID_PLACED': {
          const data = message.data as BidPlacedData;
          setBids((prev) => [data, ...prev]);
          break;
        }

        case 'PARTICIPANT_COUNT': {
          setParticipantCount((message.data as any).count || 0);
          break;
        }

        case 'ERROR': {
          setError((message.data as any).message || 'Server error');
          break;
        }

        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Auto-connect when enabled and session is ready
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    if (status !== 'authenticated') {
      // If user is not authenticated, ensure ws is disconnected
      disconnect();
      return;
    }

    // Connect once we have a token
    if (accessToken) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, status, accessToken, tenantId, auctionId]);

  return {
    connectionState,
    isConnected:
      connectionState === WsConnectionState.CONNECTED ||
      connectionState === WsConnectionState.AUTHENTICATED,
    isAuthenticated: connectionState === WsConnectionState.AUTHENTICATED,
    bids,
    participantCount,
    placeBid,
    connect,
    disconnect,
    error,
  };
}
