/**
 * @file ws-client.ts
 * @description Single WebSocket client (one per browser tab) with:
 * - Double handshake (HELLO -> HELLO_OK)
 * - NTP-like time synchronization using app-level PING/PONG
 * - Monotonic server clock (never goes backwards)
 * - Ref-counted JOIN/LEAVE per auction room
 * - Automatic rejoin after reconnect
 *
 * Notes:
 * - All countdowns in the UI should use getServerNowMs() to stay consistent across devices.
 * - The server remains authoritative for auction/item start/end times.
 */

import {
  WsConnectionState,
  type WsClientMessage,
  type WsServerMessage,
} from '@suba-go/shared-validation';

type MessageHandler = (message: WsServerMessage) => void;
type StateChangeHandler = (state: WsConnectionState) => void;
type TimeSyncHandler = (info: {
  offsetMs: number;
  rttMs: number;
  serverNowMs: number;
}) => void;

type PingSample = { offsetMs: number; rttMs: number; atMs: number };

// Async token provider used to refresh tokens before reconnect.
type TokenProvider = () => Promise<string | undefined>;

// Internal control messages emitted by the backend that are not part of the shared-validation
// `WsServerMessage` union. We keep them typed here to avoid TS errors and runtime confusion.
type WsReadyMessage = { event: 'READY'; data?: { serverTimeMs?: number } };
type WsUnauthorizedMessage = {
  event: 'UNAUTHORIZED';
  data?: { code?: string; message?: string };
};
type WsPongMessage = {
  event: 'PONG';
  data?: { requestId?: string; clientTimeMs?: number; serverTimeMs?: number };
};

type WsRawMessage =
  | WsServerMessage
  | WsReadyMessage
  | WsUnauthorizedMessage
  | WsPongMessage
  | { event: string; data?: unknown };

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

class WebSocketClient {
  private socket: WebSocket | null = null;

  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly stateHandlers = new Set<StateChangeHandler>();
  private readonly timeSyncHandlers = new Set<TimeSyncHandler>();

  private state: WsConnectionState = WsConnectionState.DISCONNECTED;
  private token?: string;
  private tokenProvider?: TokenProvider;

  // Connection promise deduplication (avoid multiple connect() races)
  private connectPromise?: Promise<void>;
  private connectPromiseToken?: string;

  // Sequence guards to ignore late events from old sockets (stale onclose/onerror).
  private connectSeq = 0;
  private activeSeq = 0;

  // Reconnect
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 8;
  private readonly baseReconnectDelayMs = 800;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  // When true, the client intentionally closed the socket and we must NOT auto-reconnect.
  // This avoids reconnect loops during logout.
  private manualClose = false;

  private readonly onOnline = () => {
    // If the browser comes back online, try to recover immediately.
    if (!this.isReady() && this.token) {
      void this.connect(this.token).catch(() => undefined);
    }
  };

  private readonly onVisibility = () => {
    // When the tab becomes visible again, the socket might have been suspended.
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible' && !this.isReady() && this.token) {
      void this.connect(this.token).catch(() => undefined);
    }
  };

  // Heartbeat / time sync
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private readonly heartbeatIntervalMs = 15000;

  // Time sync state
  private offsetMs = 0;
  private rttMs = 0;
  private readonly samples: PingSample[] = [];
  private lastServerNowMs = 0;
  private readonly pendingPings = new Map<string, number>(); // requestId -> clientSendMs

  // If the computed server clock would move backwards by more than this threshold,
  // we consider it a "real" offset correction (e.g. after reconnect / better samples)
  // and reset the monotonic guard instead of getting stuck in the future.
  private readonly maxBackwardsJumpMs = 1200;

  private resetMonotonicClock(nextServerNowMs?: number) {
    if (typeof nextServerNowMs === 'number' && Number.isFinite(nextServerNowMs)) {
      this.lastServerNowMs = nextServerNowMs;
      return;
    }
    this.lastServerNowMs = 0;
  }

  // Join ref counting
  private readonly joinCounts = new Map<string, number>(); // roomKey -> refCount
  private readonly joinedRooms = new Set<string>(); // roomKey actually joined (server-side)
  private readonly pendingJoins = new Set<string>(); // roomKey waiting for AUTH

  constructor() {
    // Best-effort resilience: recover from background tab throttling and offline/online transitions.
    // This is especially important on Vercel/Railway where proxies may close idle sockets.
    this.enableAutoRecover();
  }

  async connect(token?: string): Promise<void> {
    const resolvedToken = await this.resolveToken(token);
    if (!resolvedToken) {
      throw new Error('Missing access token for WebSocket connection');
    }

    // If already authenticated with same token, keep connection.
    const isOpen = this.socket?.readyState === WebSocket.OPEN;
    if (isOpen && this.token === resolvedToken && this.isReady()) return;

    // Deduplicate concurrent connects for the same resolved token.
    if (this.connectPromiseToken === resolvedToken && this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromiseToken = resolvedToken;

    const promise = new Promise<void>((resolve, reject) => {
      // Ensure we start from a clean state
      this.disconnect(false);

      // Each connect() starts a new "clock epoch".
      // We keep the latest known offsetMs, but we must reset the monotonic guard;
      // otherwise, if the offset is corrected downward after reconnect, the clock
      // can get stuck in the future until Date.now() catches up.
      this.resetMonotonicClock();
      this.samples.length = 0;
      this.pendingPings.clear();

      this.token = resolvedToken;
      this.setState(WsConnectionState.CONNECTING);

      // Reset reconnect attempts on explicit connect.
      this.reconnectAttempts = 0;
      this.manualClose = false;

      // Build a WS URL with the auth token as a query param. Backend accepts `?token=`.
      const baseWsUrl = this.getWebSocketUrl();
      const wsUrl = this.appendToken(baseWsUrl, resolvedToken);
      const socket = new WebSocket(wsUrl);
      this.socket = socket;

      const seq = ++this.connectSeq;
      const mySeq = seq;
      const isStale = () => mySeq !== this.connectSeq;

      let settled = false;
      const settle = (err?: unknown) => {
        if (settled) return;
        settled = true;

        if (err) {
          this.setState(WsConnectionState.ERROR);
          reject(err);
          return;
        }

        // Authenticated handshake completed.
        this.setState(WsConnectionState.AUTHENTICATED);
        resolve();
      };

      try {
        socket.addEventListener('open', () => {
          if (isStale()) return;

          // Immediately send HELLO. The server responds with HELLO_OK when authenticated.
          this.send({
            event: 'HELLO',
            data: { token: resolvedToken, clientTimeMs: Date.now() },
          });

          // Start heartbeat after open; server can still close if auth fails.
          this.startHeartbeat();

          // Kick time-sync right away so UI countdowns stabilize quickly.
          this.primeTimeSync();
        });


        socket.addEventListener('message', (event) => {
          if (isStale()) return;

          try {
            const msg = JSON.parse(event.data as string) as WsRawMessage;
            if (!msg || typeof msg.event !== 'string') return;

            // Control messages (not forwarded to app handlers)
            // The backend emits CONNECTED on upgrade, and HELLO_OK after HELLO.
            if (msg.event === 'CONNECTED') {
              const data = msg.data as any;
              const st = data?.serverTimeMs;
              if (typeof st === 'number') this.maybeNudgeOffsetFromServerTime(st);
              // Socket is open; authentication still pending.
              this.setState(WsConnectionState.CONNECTED);
              return;
            }

            // Application-level time sync.
            if (msg.event === 'PONG') {
              const data: any = (msg as any).data as any;
              const st = data?.serverTimeMs;
              if (typeof st === 'number') {
                this.handlePong({
                  requestId: typeof data?.requestId === 'string' ? data.requestId : undefined,
                  clientTimeMs: typeof data?.clientTimeMs === 'number' ? data.clientTimeMs : undefined,
                  serverTimeMs: st,
                });
              }
              return;
            }

            // Server-side auth ok signal.
            // The gateway responds to HELLO with HELLO_OK (or READY) when the token is valid.
            if (msg.event === 'HELLO_OK' || (msg as any).event === 'READY') {
              const data: any = (msg as any).data as any;
              const st = data?.serverTimeMs;
              if (typeof st === 'number') this.maybeNudgeOffsetFromServerTime(st);

              // After auth, prime time sync again so countdowns stabilize quickly.
              this.primeTimeSync();

              this.setState(WsConnectionState.AUTHENTICATED);

              // Join any rooms requested while disconnected (and re-join after reconnect).
              this.flushPendingJoins();

              settle();
              return;
            }

            // Errors are sent as an ERROR envelope with a code.
            // Treat auth errors specially so the auth-bridge can refresh and we can reconnect.
            if (msg.event === 'ERROR' || (msg as any).event === 'UNAUTHORIZED') {
              const data: any = (msg as any).data as any;
              const code = String(data?.code ?? '');
              const msgText = String(data?.message ?? 'WebSocket error');

              const isAuthError =
                (msg as any).event === 'UNAUTHORIZED' ||
                code === 'UNAUTHORIZED' ||
                code === 'TOKEN_EXPIRED';

              if (isAuthError) {
                try {
                  socket.close();
                } catch {
                  // ignore
                }
                settle(new Error(msgText));
                return;
              }
              // Non-auth errors are forwarded to listeners below.
            }

            // Room join/leave acks.
            if (msg.event === 'JOINED' || (msg as any).event === 'JOINED ROOM') {
              const data: any = (msg as any).data as any;
              const tenantId = String(data?.tenantId ?? '');
              const auctionId = String(data?.auctionId ?? '');
              if (tenantId && auctionId) this.joinedRooms.add(this.roomKey(tenantId, auctionId));
              const st = data?.serverTimeMs;
              if (typeof st === 'number') this.maybeNudgeOffsetFromServerTime(st);
            }

            if (msg.event === 'LEFT' || (msg as any).event === 'LEFT ROOM') {
              const data: any = (msg as any).data as any;
              const tenantId = String(data?.tenantId ?? '');
              const auctionId = String(data?.auctionId ?? '');
              if (tenantId && auctionId) this.joinedRooms.delete(this.roomKey(tenantId, auctionId));
            }

            // Forward all other messages to app handlers.
            this.messageHandlers.forEach((h) => h(msg as WsServerMessage));
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to parse WebSocket message:', err);
          }
        });

        socket.addEventListener('close', (event) => {
          if (isStale()) return;
          this.stopHeartbeat();
          if (this.socket === socket) {
            this.socket = null;
          }
          this.setState(WsConnectionState.DISCONNECTED);

          this.joinedRooms.clear();

          if (!settled) {
            settle(
              new Error(
                `WebSocket closed before handshake (code=${event.code}, reason=${event.reason || 'n/a'}). url=${wsUrl}`
              )
            );
          }

          // In cloud environments (Vercel/Railway), the connection can be closed with code=1000
          // without being an explicit user action (e.g., proxy idle timeout).
          // Only skip reconnect when the client intentionally closed the socket.
          if (!this.manualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        socket.addEventListener('error', (evt) => {
          if (isStale()) return;
          // Browser WebSocket errors are opaque. We rely on close/timeout for the actual failure.
          // eslint-disable-next-line no-console
          console.warn('WebSocket error event:', evt);
        });
      } catch (err) {
        this.setState(WsConnectionState.ERROR);
        settle(err);
      }
    });

    this.connectPromise = promise;
    await promise;
  }

  disconnect(manual = true) {
    // Invalidate any in-flight socket event handlers.
    this.activeSeq = ++this.connectSeq;
    this.stopHeartbeat();

    // Explicit disconnects should not trigger reconnect.
    this.manualClose = manual;

    if (manual) {
      // Clearing the token prevents auto-recover triggers (online/visibility) from reconnecting
      // after an explicit logout.
      this.token = undefined;
      this.joinCounts.clear();
      this.joinedRooms.clear();
      this.pendingJoins.clear();
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnect');
      } catch {
        // ignore
      } finally {
        this.socket = null;
      }
    }

    this.setState(WsConnectionState.DISCONNECTED);
  }

  setTokenProvider(provider?: TokenProvider) {
    this.tokenProvider = provider;
  }

  private async resolveToken(explicit?: string): Promise<string | undefined> {
    if (explicit) return explicit;
    if (this.tokenProvider) {
      try {
        const t = await this.tokenProvider();
        if (t) return t;
      } catch {
        // Ignore refresh errors; fallback to last known token.
      }
    }
    return this.token;
  }

  enableAutoRecover() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
  }

  disableAutoRecover() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
  }

  send(message: WsClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }
    // eslint-disable-next-line no-console
    console.warn('Cannot send message: WebSocket not connected');
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler);
   // Immediately emit current state so late subscribers do not miss transitions.
    try {
      handler(this.state);
    } catch {}
    return () => this.stateHandlers.delete(handler);
  }

  onTimeSync(handler: TimeSyncHandler): () => void {
    this.timeSyncHandlers.add(handler);
    return () => this.timeSyncHandlers.delete(handler);
  }

  getState(): WsConnectionState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === WsConnectionState.AUTHENTICATED && this.socket?.readyState === WebSocket.OPEN;
  }

  getServerOffsetMs(): number {
    return this.offsetMs;
  }

  getServerRttMs(): number {
    return this.rttMs;
  }

  /**
   * Best-known server clock in ms, monotonic (never goes backwards).
   */
  getServerNowMs(): number {
    const estimate = Date.now() + this.offsetMs;
    if (!this.lastServerNowMs) {
      this.lastServerNowMs = estimate;
      return estimate;
    }

    // Normally we enforce monotonicity (no backwards jumps) to avoid timers "adding" time.
    // However, after a reconnect or better time-sync samples, offsetMs can be corrected
    // downward. If we *always* clamp, the clock can get stuck in the future until the
    // local clock catches up, which is exactly the kind of bug that shows as
    // "finalizando"/"completada" until a hard refresh.
    if (estimate < this.lastServerNowMs - this.maxBackwardsJumpMs) {
      this.lastServerNowMs = estimate;
      return estimate;
    }

    if (estimate < this.lastServerNowMs) return this.lastServerNowMs;

    this.lastServerNowMs = estimate;
    return estimate;
  }

  /**
   * Ref-counted join: first subscriber triggers JOIN_AUCTION.
   */
  joinAuction(tenantId: string, auctionId: string) {
    const key = this.roomKey(tenantId, auctionId);
    const prev = this.joinCounts.get(key) ?? 0;
    this.joinCounts.set(key, prev + 1);

    if (!this.isReady()) {
      this.pendingJoins.add(key);
      return;
    }

    if (!this.joinedRooms.has(key)) {
      this.send({ event: 'JOIN_AUCTION', data: { tenantId, auctionId } });
    }
  }

  /**
   * Ref-counted leave: last subscriber triggers LEAVE_AUCTION.
   */
  leaveAuction(tenantId: string, auctionId: string) {
    const key = this.roomKey(tenantId, auctionId);
    const prev = this.joinCounts.get(key) ?? 0;
    const next = Math.max(0, prev - 1);

    if (next === 0) {
      this.joinCounts.delete(key);
      this.pendingJoins.delete(key);
      this.joinedRooms.delete(key);
      if (this.isReady()) {
        this.send({ event: 'LEAVE_AUCTION', data: { tenantId, auctionId } });
      }
      return;
    }

    this.joinCounts.set(key, next);
  }

  private flushPendingJoins() {
    if (!this.isReady()) return;

    for (const [key, count] of this.joinCounts.entries()) {
      if (count <= 0) continue;
      const [tenantId, auctionId] = key.split(':');
      this.send({ event: 'JOIN_AUCTION', data: { tenantId, auctionId } });
    }

    this.pendingJoins.clear();
  }

  private roomKey(tenantId: string, auctionId: string): string {
    return `${tenantId}:${auctionId}`;
  }

  private primeTimeSync() {
    const burst = [0, 400, 800];
    burst.forEach((delay) => {
      setTimeout(() => this.sendPing(), delay);
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendPing();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private sendPing() {
    const requestId = createRequestId();
    const clientTimeMs = Date.now();
    this.pendingPings.set(requestId, clientTimeMs);

    setTimeout(() => {
      this.pendingPings.delete(requestId);
    }, 20000);

    this.send({
      event: 'PING',
      data: { requestId, clientTimeMs },
    });
  }

  private handlePong(data: { requestId?: string; clientTimeMs?: number; serverTimeMs: number }) {
    const now = Date.now();
    const requestId = data?.requestId;

    const sent =
      typeof data?.clientTimeMs === 'number'
        ? data.clientTimeMs
        : requestId
          ? this.pendingPings.get(requestId)
          : undefined;

    if (requestId) this.pendingPings.delete(requestId);
    if (typeof sent !== 'number') return;

    const rtt = Math.max(0, now - sent);
    const midpoint = sent + rtt / 2;
    const offset = data.serverTimeMs - midpoint;

    this.samples.push({ offsetMs: offset, rttMs: rtt, atMs: now });

    const cutoff = now - 60000;
    while (this.samples.length > 0 && this.samples[0].atMs < cutoff) {
      this.samples.shift();
    }

    this.updateOffsetFromSamples();
  }

  private updateOffsetFromSamples() {
    if (this.samples.length === 0) return;

    const sortedByRtt = [...this.samples].sort((a, b) => a.rttMs - b.rttMs);
    const best = sortedByRtt.slice(0, Math.min(7, sortedByRtt.length));

    const offsets = best.map((s) => s.offsetMs).sort((a, b) => a - b);
    const median = offsets[Math.floor(offsets.length / 2)];
    const avgRtt = Math.round(best.reduce((acc, s) => acc + s.rttMs, 0) / best.length);

    const alpha = 0.2;
    const nextOffset = Math.round(this.offsetMs * (1 - alpha) + median * alpha);

    this.offsetMs = nextOffset;
    this.rttMs = avgRtt;

    const serverNowMs = this.getServerNowMs();
    this.timeSyncHandlers.forEach((h) => h({ offsetMs: this.offsetMs, rttMs: this.rttMs, serverNowMs }));
  }

  private maybeNudgeOffsetFromServerTime(serverTimeMs: number) {
    if (this.samples.length >= 3) return;
    const estimated = serverTimeMs - Date.now();
    const alpha = 0.1;
    this.offsetMs = Math.round(this.offsetMs * (1 - alpha) + estimated * alpha);
    const serverNowMs = this.getServerNowMs();
    this.timeSyncHandlers.forEach((h) => h({ offsetMs: this.offsetMs, rttMs: this.rttMs, serverNowMs }));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts += 1;

    const exp = Math.min(this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1), 30000);
    const jitter = Math.floor(Math.random() * 250);
    const delay = exp + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (!this.token && !this.tokenProvider) return;

      this.connect(undefined).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Reconnection failed:', err);
      });
    }, delay);
  }

  private setState(state: WsConnectionState) {
    if (this.state === state) return;
    this.state = state;
    this.stateHandlers.forEach((h) => h(state));
  }

  private appendToken(baseWsUrl: string, token: string): string {
    try {
      const u = new URL(baseWsUrl);
      u.searchParams.set('token', token);
      return u.toString();
    } catch {
      const sep = baseWsUrl.includes('?') ? '&' : '?';
      return `${baseWsUrl}${sep}token=${encodeURIComponent(token)}`;
    }
  }

  private getWebSocketUrl(): string {
    const ensureWsPath = (url: URL): string => {
      url.pathname = '/ws';
      url.search = '';
      url.hash = '';
      return url.toString().replace(/\/$/, '');
    };

    const toWsUrl = (input: string): string | null => {
      try {
        const u = new URL(input);
        const proto = u.protocol === 'https:' || u.protocol === 'wss:' ? 'wss:' : 'ws:';
        u.protocol = proto;
        return ensureWsPath(u);
      } catch {
        return null;
      }
    };

    const explicit = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_ENDPOINT;
    if (explicit) {
      const parsed = toWsUrl(explicit);
      if (parsed) return parsed;
    }

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      const parsed = toWsUrl(backendUrl);
      if (parsed) return parsed;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const parsed = toWsUrl(apiUrl);
      if (parsed) return parsed;
    }

    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.NEXT_PUBLIC_WS_PORT || '3001';
      return `${proto}//${window.location.hostname}:${backendPort}/ws`;
    }

    return 'ws://localhost:3001/ws';
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __subago_wsClient: WebSocketClient | undefined;
}

// In Next.js dev mode (HMR), modules can be re-evaluated multiple times.
// Keeping the client on globalThis avoids multiple sockets and "ghost" onclose events
// that can incorrectly flip the UI to "disconnected".
export const wsClient: WebSocketClient =
  (globalThis as any).__subago_wsClient ?? ((globalThis as any).__subago_wsClient = new WebSocketClient());
