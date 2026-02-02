/**
 * @file use-auction-websocket-bidding.ts
 * @description Auction realtime hook that uses the singleton wsClient.
 *
 * Key goals:
 * - Exactly one WebSocket connection per browser tab (wsClient).
 * - Ref-counted JOIN/LEAVE so multiple components can observe the same auction safely.
 * - NTP-style server clock sync (via wsClient PING/PONG) for consistent timers across devices.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { wsClient } from '@/lib/ws-client';
import {
  WsConnectionState,
  type WsServerMessage,
} from '@suba-go/shared-validation';

export interface BidData {
  auctionItemId: string;
  amount: number;
  userId: string;
  userName?: string;
  bidId: string;
  requestId?: string;
  timestamp: number;
  serverTimeMs?: number;
}

interface TimeExtensionData {
  auctionId: string;
  auctionItemId?: string;
  newEndTime: string;
  extensionSeconds: number;
  serverTimeMs?: number;
}

export interface JoinedSnapshotData {
  auction?: { id: string; status: string; startTime?: string; endTime?: string };
  auctionItems?: Array<{ id: string; startTime?: string; endTime?: string }>;
}

interface UseAuctionWebSocketBiddingProps {
  auctionId: string;
  tenantId: string;
  accessToken: string;
  onBidPlaced?: (data: BidData) => void;
  onBidRejected?: (data: {
    auctionItemId: string;
    reason: string;
    requestId?: string;
  }) => void;
  onTimeExtension?: (data: TimeExtensionData) => void;
  onStatusChanged?: (status: string) => void;
  onJoined?: () => void;
  onSnapshot?: (data: JoinedSnapshotData) => void;
}

interface UseAuctionWebSocketBiddingReturn {
  isConnected: boolean;
  connectionState: WsConnectionState;
  isJoined: boolean;
  participantCount: number;
  connectionError: string | null;
  /** Difference between server clock and local clock in ms (server - local). */
  serverOffsetMs: number;
  /** Best-known server clock in ms, monotonic (never goes backwards). */
  serverNowMonotonicMs: number;
  /** Measured round-trip-time to the server in ms (best effort). */
  serverRttMs: number;
  /**
   * Sends a bid through WebSocket.
   * 
   * This method includes client-side protections:
   * - Cooldown to prevent accidental spam-clicks.
   * - Avoids sending when not ready or not joined.
   */
  sendBid: (
    auctionItemId: string,
    amount: number
  ) =>
    | { ok: true; requestId: string }
    | { ok: false; reason: 'NOT_CONNECTED' | 'NOT_JOINED' | 'COOLDOWN'; retryAfterMs?: number };
}

function createRequestId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = typeof crypto !== 'undefined' ? crypto : undefined;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useAuctionWebSocketBidding(
  props: UseAuctionWebSocketBiddingProps
): UseAuctionWebSocketBiddingReturn {
  const { auctionId, tenantId, accessToken } = props;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<WsConnectionState>(WsConnectionState.DISCONNECTED);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [serverNowMonotonicMs, setServerNowMonotonicMs] = useState(() => Date.now());
  const [serverRttMs, setServerRttMs] = useState(0);

  // Client-side bid spam protection.
  // Prevents accidental double-clicks and reduces websocket/message load.
  const lastBidSentAtRef = useRef<Map<string, number>>(new Map());
  const bidCooldownMs = 600;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!accessToken || !auctionId || !tenantId) return;

    setConnectionError(null);

    wsClient.connect(accessToken).catch((err) => {
      if (!mountedRef.current) return;
      setConnectionError(err instanceof Error ? err.message : 'WebSocket connection failed');
    });

    const unsubState = wsClient.onStateChange((state) => {
      if (!mountedRef.current) return;
      setConnectionState(state);
      const ready = state === WsConnectionState.AUTHENTICATED;
      setIsConnected(ready);
      if (!ready) setIsJoined(false);
    });

    const unsubSync = wsClient.onTimeSync((info) => {
      if (!mountedRef.current) return;
      setServerOffsetMs(info.offsetMs);
      setServerNowMonotonicMs(info.serverNowMs);
      setServerRttMs(info.rttMs || 0);
    });

    wsClient.joinAuction(tenantId, auctionId);

    const unsubMsg = wsClient.onMessage((message: WsServerMessage) => {
      if (!mountedRef.current) return;

      switch (message.event) {
        case 'JOINED': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          setIsJoined(true);
          setParticipantCount(Number(data?.participantCount || 0));
          props.onJoined?.();

          const snap: JoinedSnapshotData = {
            auction: data?.auction,
            auctionItems: data?.auctionItems,
          };
          if (snap.auction || (snap.auctionItems && snap.auctionItems.length > 0)) {
            props.onSnapshot?.(snap);
          }
          return;
        }

        case 'PARTICIPANT_COUNT': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          setParticipantCount(Number(data?.count || 0));
          return;
        }

        case 'BID_PLACED': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          props.onBidPlaced?.(data as BidData);
          return;
        }

        case 'BID_REJECTED': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          props.onBidRejected?.({
            auctionItemId: data?.auctionItemId,
            reason: data?.reason || 'Bid rejected',
            requestId: data?.requestId,
          });
          return;
        }

        case 'AUCTION_TIME_EXTENDED': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          props.onTimeExtension?.(data as TimeExtensionData);
          return;
        }

        case 'AUCTION_STATUS_CHANGED': {
          const data: any = message.data as any;
          if (data?.auctionId !== auctionId) return;
          if (typeof data?.status === 'string') props.onStatusChanged?.(data.status);
          return;
        }

        default:
          return;
      }
    });

    return () => {
      unsubState();
      unsubSync();
      unsubMsg();
      wsClient.leaveAuction(tenantId, auctionId);
    };
  }, [auctionId, tenantId, accessToken]);

  const sendBid = useCallback(
    (auctionItemId: string, amount: number) => {
      if (!wsClient.isReady()) {
        setConnectionError('WebSocket not ready');
        return { ok: false as const, reason: 'NOT_CONNECTED' as const };
      }
      if (!isJoined) {
        setConnectionError('WebSocket room not joined');
        return { ok: false as const, reason: 'NOT_JOINED' as const };
      }

      // Cooldown per item.
      const now = Date.now();
      const last = lastBidSentAtRef.current.get(auctionItemId) || 0;
      const delta = now - last;
      if (delta < bidCooldownMs) {
        return {
          ok: false as const,
          reason: 'COOLDOWN' as const,
          retryAfterMs: Math.max(0, bidCooldownMs - delta),
        };
      }
      lastBidSentAtRef.current.set(auctionItemId, now);

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

      return { ok: true as const, requestId };
    },
    [tenantId, auctionId, isJoined]
  );

  useEffect(() => {
    const t = setInterval(() => {
      if (!mountedRef.current) return;
      setServerNowMonotonicMs(wsClient.getServerNowMs());
    }, 250);

    return () => clearInterval(t);
  }, []);

  return {
    isConnected,
    connectionState,
    isJoined,
    participantCount,
    connectionError,
    serverOffsetMs,
    serverNowMonotonicMs,
    serverRttMs,
    sendBid,
  };
}
