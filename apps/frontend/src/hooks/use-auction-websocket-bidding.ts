/**
 * @file use-auction-websocket-bidding.ts
 * @description Hook for managing WebSocket connection for auction bidding
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface BidData {
  auctionItemId: string;
  amount: number;
  userId: string;
  userName?: string;
  bidId: string;
  timestamp: number;
}

interface TimeExtensionData {
  auctionId: string;
  newEndTime: string;
  extensionSeconds: number;
}

interface WebSocketMessage {
  event: string;
  data: any;
}

interface UseAuctionWebSocketBiddingProps {
  auctionId: string;
  tenantId: string;
  accessToken: string;
  onBidPlaced?: (data: BidData) => void;
  onBidRejected?: (data: { auctionItemId: string; reason: string }) => void;
  onTimeExtension?: (data: TimeExtensionData) => void;
  onStatusChanged?: (status: string) => void;
}

interface UseAuctionWebSocketBiddingReturn {
  isConnected: boolean;
  isJoined: boolean;
  participantCount: number;
  connectionError: string | null;
  sendBid: (auctionItemId: string, amount: number) => void;
}

const getWebSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_ENDPOINT) {
    return process.env.NEXT_PUBLIC_WS_ENDPOINT;
  }
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return backendUrl.replace(/^http/, 'ws') + '/ws';
};

// Global connection tracker to prevent multiple connections in React Strict Mode
const activeConnections = new Map<string, WebSocket>();

export function useAuctionWebSocketBidding({
  auctionId,
  tenantId,
  accessToken,
  onBidPlaced,
  onBidRejected,
  onTimeExtension,
  onStatusChanged,
}: UseAuctionWebSocketBiddingProps): UseAuctionWebSocketBiddingReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const connectionKey = `${tenantId}:${auctionId}`;

  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // WebSocket connection - single useEffect
  useEffect(() => {
    console.log('[WS] useEffect triggered for:', connectionKey);
    console.log('[WS] Active connections:', activeConnections.size);

    // Check if there's already an active connection for this auction
    const existingConnection = activeConnections.get(connectionKey);
    if (existingConnection) {
      const state = existingConnection.readyState;
      console.log('[WS] Existing connection state:', state, {
        CONNECTING: WebSocket.CONNECTING,
        OPEN: WebSocket.OPEN,
        CLOSING: WebSocket.CLOSING,
        CLOSED: WebSocket.CLOSED,
      });

      // Reuse if OPEN or CONNECTING (don't interrupt connection in progress)
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        console.log('[WS] Reusing existing connection for:', connectionKey);
        wsRef.current = existingConnection;

        // Set states based on current connection state
        if (state === WebSocket.OPEN) {
          setIsConnected(true);
          setIsJoined(true);
        }

        return () => {
          // Don't close the connection on cleanup if we're reusing it
          console.log(
            '[WS] Cleanup: Keeping shared connection open for:',
            connectionKey
          );
        };
      }

      // If CLOSING or CLOSED, remove it
      console.log('[WS] Removing stale connection (state:', state, ')');
      activeConnections.delete(connectionKey);
    }

    // Prevent multiple connections from same component
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[WS] Connection already exists in ref');
      return;
    }

    const wsEndpoint = getWebSocketUrl();
    const wsUrl = `${wsEndpoint}?token=${encodeURIComponent(accessToken)}`;
    console.log(
      '[WS] Creating new connection to:',
      wsUrl.replace(/token=.*/, 'token=***')
    );

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    activeConnections.set(connectionKey, ws);

    ws.onopen = () => {
      console.log('[WS] Connected - joining auction room immediately');
      setIsConnected(true);
      setConnectionError(null);

      // Join auction room immediately (no handshake needed)
      ws.send(
        JSON.stringify({
          event: 'JOIN_AUCTION',
          data: { tenantId, auctionId },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('[WS] Received:', message.event, message.data);

        switch (message.event) {
          case 'CONNECTED':
            // Ignore - we already joined in onopen
            break;

          case 'JOINED':
            console.log('[WS] Successfully joined auction room');
            setIsJoined(true);
            if (message.data.participantCount) {
              setParticipantCount(message.data.participantCount);
            }
            break;

          case 'PARTICIPANT_COUNT':
            setParticipantCount(message.data.count);
            break;

          case 'KICKED_DUPLICATE':
            console.warn(
              '[WS] Removed from room due to duplicate connection:',
              message.data
            );
            // We were removed from the room on this tab because another tab joined.
            // Keep the socket but mark as not joined; server will broadcast new count.
            setIsJoined(false);
            break;

          case 'BID_PLACED':
            onBidPlaced?.(message.data);
            break;

          case 'BID_REJECTED':
            onBidRejected?.(message.data);
            break;

          case 'AUCTION_TIME_EXTENDED':
            onTimeExtension?.(message.data);
            break;

          case 'AUCTION_STATUS_CHANGED':
            console.log('[WS] Auction status changed:', message.data.status);
            onStatusChanged?.(message.data.status);
            if (message.data.status === 'COMPLETADA') {
              window.location.reload();
            }
            break;

          case 'ERROR':
            console.error('[WS] Server error:', message.data);
            console.error('[WS] Error details:', {
              code: message.data.code,
              message: message.data.message,
              auctionId,
              tenantId,
            });
            setConnectionError(message.data.message);
            break;
        }
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      setConnectionError('Error de conexión WebSocket');
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
      setIsJoined(false);
      activeConnections.delete(connectionKey);
    };

    return () => {
      console.log('[WS] Cleanup called for:', connectionKey);

      // In React Strict Mode, cleanup is called immediately after mount
      // We should NOT close the connection here, as it will be reused
      // Only close if the connection is not in the global map (component truly unmounting)
      const globalConnection = activeConnections.get(connectionKey);

      if (wsRef.current && wsRef.current === globalConnection) {
        console.log('[WS] Cleanup: Keeping connection in global map');
        // Don't close - let it be reused
      } else if (wsRef.current) {
        console.log('[WS] Cleanup: Closing orphaned connection');
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      }

      // Clear the ref but keep the connection in the global map
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only connect once on mount

  // Send bid function
  const sendBid = useCallback(
    (auctionItemId: string, amount: number) => {
      // Always try to get the active connection from the global Map
      const activeWs = activeConnections.get(connectionKey);
      const ws = activeWs || wsRef.current;

      if (!isJoined) {
        console.warn('[WS] Not joined to auction room - ignoring bid');
        return;
      }

      if (ws?.readyState === WebSocket.OPEN) {
        const requestId = crypto.randomUUID();
        console.log('[WS] Sending bid:', {
          auctionItemId,
          amount,
          tenantId,
          auctionId,
          requestId,
        });
        ws.send(
          JSON.stringify({
            event: 'PLACE_BID',
            data: { tenantId, auctionId, auctionItemId, amount, requestId },
          })
        );
      } else {
        console.error('[WS] Cannot send bid - connection not open', {
          wsRefState: wsRef.current?.readyState,
          activeWsState: activeWs?.readyState,
          hasActiveConnection: !!activeWs,
        });
      }
    },
    [tenantId, auctionId, connectionKey, isJoined]
  );

  return {
    isConnected,
    isJoined,
    participantCount,
    connectionError,
    sendBid,
  };
}
