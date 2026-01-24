/**
 * @file use-auction-websocket-bidding.ts
 * @description Hook for managing WebSocket connection for auction bidding.
 *
 * Key goals:
 * - One WS per (tenantId, auctionId) per browser tab.
 * - No leaked sockets when navigating (ref-counted close on last subscriber).
 * - Safe sendBid (never stuck loading when WS not ready/joined).
 * - Stable handlers (no stale-closure issues).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface BidData {
  auctionItemId: string;
  amount: number;
  userId: string;
  userName?: string;
  bidId: string;
  requestId?: string;
  timestamp: number;
  serverTimeMs?: number; // optional, for time sync
}

interface TimeExtensionData {
  auctionId: string;
  auctionItemId?: string;
  newEndTime: string;
  extensionSeconds: number;
  serverTimeMs?: number;
}


export interface JoinedSnapshotData {
  auction?: {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
  };
  auctionItems?: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
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
  isJoined: boolean;
  participantCount: number;
  connectionError: string | null;
  /** Difference between server clock and local clock in ms (server - local). */
  serverOffsetMs: number;
  /** Returns requestId if the bid was sent. */
  sendBid: (auctionItemId: string, amount: number) => string | null;
}

const getWebSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_ENDPOINT) {
    return process.env.NEXT_PUBLIC_WS_ENDPOINT;
  }
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return backendUrl.replace(/^http/, 'ws') + '/ws';
};

type Subscriber = {
  onOpen: () => void;
  onClose: () => void;
  onError: (err: string) => void;
  onMessage: (msg: WebSocketMessage) => void;
};

type ManagedConn = {
  key: string;
  socket: WebSocket;
  subscribers: Set<Subscriber>;
  refCount: number;
  joined: boolean;
  participantCount: number;
  serverOffsetMs: number;
  lastError: string | null;
  closing: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  tenantId: string;
  auctionId: string;
  accessToken: string;
};

// Global, per-tab connection pool.
const connections = new Map<string, ManagedConn>();

function backoffMs(attempt: number): number {
  // 0 -> 500ms, 1 -> 750ms, 2 -> 1125ms ... capped
  const base = 500;
  const ms = Math.floor(base * Math.pow(1.5, attempt));
  return Math.min(ms, 8000);
}

function safeParseMessage(raw: any): WebSocketMessage | null {
  try {
    if (typeof raw !== 'string') return null;
    return JSON.parse(raw) as WebSocketMessage;
  } catch {
    return null;
  }
}

function createSocket(accessToken: string): WebSocket {
  const wsEndpoint = getWebSocketUrl();
  const wsUrl = `${wsEndpoint}?token=${encodeURIComponent(accessToken)}`;
  return new WebSocket(wsUrl);
}

function createRequestId(): string {
  // Safer than relying on crypto.randomUUID() existing in every browser.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = typeof crypto !== 'undefined' ? (crypto as any) : undefined;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID();
    }
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function attachSocketHandlers(conn: ManagedConn) {
  const ws = conn.socket;

  ws.onopen = () => {
    conn.reconnectAttempts = 0;
    conn.lastError = null;
    conn.subscribers.forEach((s) => s.onOpen());

    // Always (re)join on open.
    try {
      ws.send(
        JSON.stringify({
          event: 'JOIN_AUCTION',
          data: { tenantId: conn.tenantId, auctionId: conn.auctionId },
        })
      );
    } catch {
      // If send fails here, onclose/onerror will take over.
    }
  };

  ws.onmessage = (ev) => {
    const msg = safeParseMessage(ev.data);
    if (!msg) return;

    // Keep minimal shared state on the connection.
    if (msg.event === 'JOINED') {
      conn.joined = true;
      if (typeof msg.data?.participantCount === 'number') {
        conn.participantCount = msg.data.participantCount;
      }
      if (typeof msg.data?.serverTimeMs === 'number') {
        conn.serverOffsetMs = msg.data.serverTimeMs - Date.now();
      }
    }

    if (msg.event === 'PARTICIPANT_COUNT') {
      if (typeof msg.data?.count === 'number') {
        conn.participantCount = msg.data.count;
      }
    }

    // IMPORTANT: if this socket got kicked because of a duplicate connection,
    // close it to avoid leaks / zombie sockets (server only removes it from the room).
    if (msg.event === 'KICKED_DUPLICATE') {
      conn.joined = false;
      try {
        conn.socket.close(4000, 'Duplicate connection');
      } catch {
        // ignore
      }
    }

    // Update server offset when available.
    if (
      (msg.event === 'BID_PLACED' || msg.event === 'AUCTION_TIME_EXTENDED') &&
      typeof msg.data?.serverTimeMs === 'number'
    ) {
      conn.serverOffsetMs = msg.data.serverTimeMs - Date.now();
    }

    if (msg.event === 'ERROR') {
      const serverMsg =
        typeof msg.data?.message === 'string'
          ? msg.data.message
          : 'Error de conexión WebSocket';
      conn.lastError = serverMsg;
    }

    conn.subscribers.forEach((s) => s.onMessage(msg));
  };

  ws.onerror = () => {
    conn.lastError = 'Error de conexión WebSocket';
    conn.subscribers.forEach((s) => s.onError(conn.lastError!));
  };

  ws.onclose = () => {
    conn.joined = false;
    conn.subscribers.forEach((s) => s.onClose());

    if (conn.closing) {
      // Expected close (last subscriber unmounted).
      return;
    }

    // Reconnect only if somebody still needs the connection.
    if (conn.refCount <= 0) return;

    if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
    const wait = backoffMs(conn.reconnectAttempts++);
    conn.reconnectTimer = setTimeout(() => {
      if (conn.refCount <= 0 || conn.closing) return;
      conn.socket = createSocket(conn.accessToken);
      attachSocketHandlers(conn);
    }, wait);
  };
}

function getOrCreateConnection(params: {
  tenantId: string;
  auctionId: string;
  accessToken: string;
}): ManagedConn {
  const key = `${params.tenantId}:${params.auctionId}`;
  const existing = connections.get(key);
  if (existing) {
    // If token changed, update it for future reconnects.
    existing.accessToken = params.accessToken;
    existing.tenantId = params.tenantId;
    existing.auctionId = params.auctionId;
    return existing;
  }

  const conn: ManagedConn = {
    key,
    socket: createSocket(params.accessToken),
    subscribers: new Set<Subscriber>(),
    refCount: 0,
    joined: false,
    participantCount: 0,
    serverOffsetMs: 0,
    lastError: null,
    closing: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
    tenantId: params.tenantId,
    auctionId: params.auctionId,
    accessToken: params.accessToken,
  };

  attachSocketHandlers(conn);
  connections.set(key, conn);
  return conn;
}

export function useAuctionWebSocketBidding({
  auctionId,
  tenantId,
  accessToken,
  onBidPlaced,
  onBidRejected,
  onTimeExtension,
  onStatusChanged,
  onJoined,
  onSnapshot,
}: UseAuctionWebSocketBiddingProps): UseAuctionWebSocketBiddingReturn {
  const connectionKey = useMemo(() => `${tenantId}:${auctionId}`, [tenantId, auctionId]);

  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  const callbacksRef = useRef({
    onBidPlaced,
    onBidRejected,
    onTimeExtension,
    onStatusChanged,
    onJoined,
    onSnapshot,
  });

  useEffect(() => {
    callbacksRef.current = {
      onBidPlaced,
      onBidRejected,
      onTimeExtension,
      onStatusChanged,
      onJoined,
      onSnapshot,
    };
  }, [onBidPlaced, onBidRejected, onTimeExtension, onStatusChanged, onJoined, onSnapshot]);

  const connRef = useRef<ManagedConn | null>(null);

  useEffect(() => {
    if (!tenantId || !auctionId || !accessToken) {
      setConnectionError('Faltan datos para conectar en tiempo real');
      return;
    }

    const conn = getOrCreateConnection({ tenantId, auctionId, accessToken });
    connRef.current = conn;
    conn.refCount += 1;

    // Initial state sync for late subscribers.
    setConnectionError(conn.lastError);
    setParticipantCount(conn.participantCount);
    setServerOffsetMs(conn.serverOffsetMs);
    setIsJoined(conn.joined);
    setIsConnected(conn.socket.readyState === WebSocket.OPEN);

    const subscriber: Subscriber = {
      onOpen: () => {
        setIsConnected(true);
        setConnectionError(null);
      },
      onClose: () => {
        setIsConnected(false);
        setIsJoined(false);
      },
      onError: (err) => {
        setConnectionError(err);
      },
      onMessage: (msg) => {
        // Keep local state updated from connection shared state.
        if (msg.event === 'JOINED') {
          setIsJoined(true);
          setParticipantCount(conn.participantCount);
          setServerOffsetMs(conn.serverOffsetMs);
          // If server provided a snapshot (auction / item clocks), sync it immediately.
          callbacksRef.current.onSnapshot?.({
            auction: msg.data?.auction,
            auctionItems: msg.data?.auctionItems,
          });
          callbacksRef.current.onJoined?.();
          return;
        }

        if (msg.event === 'PARTICIPANT_COUNT') {
          setParticipantCount(conn.participantCount);
          return;
        }

        if (msg.event === 'KICKED_DUPLICATE') {
          setIsJoined(false);
          setConnectionError(
            'Se detectó otra sesión conectada a esta subasta con tu usuario.'
          );
          return;
        }

        if (msg.event === 'BID_PLACED') {
          setServerOffsetMs(conn.serverOffsetMs);
          callbacksRef.current.onBidPlaced?.(msg.data);
          return;
        }

        if (msg.event === 'BID_REJECTED') {
          callbacksRef.current.onBidRejected?.(msg.data);
          return;
        }

        if (msg.event === 'AUCTION_TIME_EXTENDED') {
          setServerOffsetMs(conn.serverOffsetMs);
          callbacksRef.current.onTimeExtension?.(msg.data);
          return;
        }

        if (msg.event === 'AUCTION_STATUS_CHANGED') {
          callbacksRef.current.onStatusChanged?.(msg.data?.status);
          return;
        }

        if (msg.event === 'ERROR') {
          const msgText =
            typeof msg.data?.message === 'string'
              ? msg.data.message
              : 'Error de conexión WebSocket';
          setConnectionError(msgText);
          return;
        }
      },
    };

    conn.subscribers.add(subscriber);

    return () => {
      conn.subscribers.delete(subscriber);
      conn.refCount = Math.max(0, conn.refCount - 1);

      if (conn.refCount === 0) {
        // Close connection cleanly when last subscriber unmounts.
        conn.closing = true;
        if (conn.reconnectTimer) {
          clearTimeout(conn.reconnectTimer);
          conn.reconnectTimer = null;
        }
        try {
          if (conn.socket.readyState === WebSocket.OPEN && conn.joined) {
            conn.socket.send(
              JSON.stringify({
                event: 'LEAVE_AUCTION',
                data: { tenantId: conn.tenantId, auctionId: conn.auctionId },
              })
            );
          }
        } catch {
          // ignore
        }
        try {
          if (
            conn.socket.readyState === WebSocket.OPEN ||
            conn.socket.readyState === WebSocket.CONNECTING
          ) {
            conn.socket.close(1000, 'Unmount');
          }
        } catch {
          // ignore
        }

        connections.delete(conn.key);
      }

      if (connRef.current?.key === conn.key) {
        connRef.current = null;
      }
    };
  }, [tenantId, auctionId, accessToken, connectionKey]);

  const sendBid = useCallback(
    (auctionItemId: string, amount: number): string | null => {
      const conn = connRef.current;
      if (!conn) {
        return null;
      }

      // Must be joined to the room.
      if (!conn.joined) {
        return null;
      }

      const ws = conn.socket;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return null;
      }

      const requestId = createRequestId();
      try {
        ws.send(
          JSON.stringify({
            event: 'PLACE_BID',
            data: {
              tenantId: conn.tenantId,
              auctionId: conn.auctionId,
              auctionItemId,
              amount,
              requestId,
            },
          })
        );
        return requestId;
      } catch {
        return null;
      }
    },
    []
  );

  return {
    isConnected,
    isJoined,
    participantCount,
    connectionError,
    serverOffsetMs,
    sendBid,
  };
}
