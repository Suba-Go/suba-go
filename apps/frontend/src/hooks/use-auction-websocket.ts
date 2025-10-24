/**
 * @file use-auction-websocket.ts
 * @description React hook for auction WebSocket connection and bid handling
 * Manages auction room subscription and real-time bid updates
 * @author Suba&Go
 */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsClient, getAccessToken } from '@/lib/ws-client';
import type {
  WsServerMessage,
  BidPlacedData,
  WsConnectionState,
} from '@suba-go/shared-validation';

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
  const [connectionState, setConnectionState] = useState<WsConnectionState>(
    wsClient.getState()
  );
  const [bids, setBids] = useState<BidPlacedData[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  
  // Track if we've already connected to prevent duplicate connections
  const connectionAttempted = useRef(false);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;

    try {
      const token = getAccessToken();
      if (!token) {
        setError('No access token found');
        return;
      }

      await wsClient.connect(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      connectionAttempted.current = false;
    }
  }, []);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (hasJoinedRoom) {
      wsClient.send({
        event: 'LEAVE_AUCTION',
        data: { tenantId, auctionId },
      });
      setHasJoinedRoom(false);
    }
    wsClient.disconnect();
    connectionAttempted.current = false;
  }, [tenantId, auctionId, hasJoinedRoom]);

  /**
   * Join auction room after authentication
   */
  const joinAuctionRoom = useCallback(() => {
    if (wsClient.isReady() && !hasJoinedRoom) {
      wsClient.send({
        event: 'JOIN_AUCTION',
        data: { tenantId, auctionId },
      });
      setHasJoinedRoom(true);
    }
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

      wsClient.send({
        event: 'PLACE_BID',
        data: { tenantId, auctionId, auctionItemId, amount },
      });
    },
    [tenantId, auctionId]
  );

  /**
   * Handle incoming WebSocket messages
   */
  useEffect(() => {
    const handleMessage = (message: WsServerMessage) => {
      switch (message.event) {
        case 'HELLO_OK':
          // Authentication complete, join auction room
          joinAuctionRoom();
          break;

        case 'JOINED':
          setParticipantCount(message.data.participantCount);
          setError(null);
          break;

        case 'BID_PLACED':
          // Add new bid to the list
          setBids((prev) => [message.data, ...prev]);
          break;

        case 'BID_REJECTED':
          setError(message.data.reason);
          break;

        case 'PARTICIPANT_COUNT':
          if (message.data.auctionId === auctionId) {
            setParticipantCount(message.data.count);
          }
          break;

        case 'AUCTION_STATUS_CHANGED':
          if (message.data.auctionId === auctionId) {
            // Handle auction status change (e.g., auction ended)
            console.log('Auction status changed:', message.data.status);
          }
          break;

        case 'ERROR':
          setError(message.data.message);
          break;
      }
    };

    const unsubscribe = wsClient.onMessage(handleMessage);
    return unsubscribe;
  }, [auctionId, joinAuctionRoom]);

  /**
   * Handle connection state changes
   */
  useEffect(() => {
    const handleStateChange = (state: WsConnectionState) => {
      setConnectionState(state);
      
      // Join room when authenticated
      if (state === 'AUTHENTICATED') {
        joinAuctionRoom();
      }
      
      // Reset room state when disconnected
      if (state === 'DISCONNECTED') {
        setHasJoinedRoom(false);
      }
    };

    const unsubscribe = wsClient.onStateChange(handleStateChange);
    return unsubscribe;
  }, [joinAuctionRoom]);

  /**
   * Auto-connect when enabled
   */
  useEffect(() => {
    if (enabled && !connectionAttempted.current) {
      connect();
    }

    return () => {
      // Leave room on unmount
      if (hasJoinedRoom) {
        wsClient.send({
          event: 'LEAVE_AUCTION',
          data: { tenantId, auctionId },
        });
      }
    };
  }, [enabled, connect, tenantId, auctionId, hasJoinedRoom]);

  return {
    connectionState,
    isConnected: connectionState === 'CONNECTED' || connectionState === 'AUTHENTICATED',
    isAuthenticated: connectionState === 'AUTHENTICATED',
    bids,
    participantCount,
    placeBid,
    connect,
    disconnect,
    error,
  };
}

