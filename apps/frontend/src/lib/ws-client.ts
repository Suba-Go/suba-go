/**
 * @file ws-client.ts
 * @description WebSocket client utility with double handshake support (HELLO -> HELLO_OK)
 *
 * Improvements:
 * - connect() resolves ONLY after HELLO_OK
 * - Prevents concurrent connect attempts (single in-flight promise)
 * - Robust URL building to avoid accidentally connecting to Next.js (:3000) websockets
 * - Avoids treating browser 'error' events (often empty {}) as fatal; relies on close/timeout instead
 */

import {
  WsConnectionState,
  type WsClientMessage,
  type WsServerMessage,
} from '@suba-go/shared-validation';

type MessageHandler = (message: WsServerMessage) => void;
type StateChangeHandler = (state: WsConnectionState) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();
  private state: WsConnectionState = WsConnectionState.DISCONNECTED;

  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelayMs = 1000;

  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  private token?: string;

  // Prevent duplicate parallel connections from multiple callers
  private connectPromise?: Promise<void>;
  private connectPromiseToken?: string;

  connect(token: string): Promise<void> {
    // If there is already an in-flight connect for the same token, reuse it.
    if (this.connectPromise && this.connectPromiseToken === token) {
      return this.connectPromise;
    }

    // If already authenticated with same token, keep connection.
    const isOpen = this.socket?.readyState === WebSocket.OPEN;
    if (isOpen && this.token === token && this.isReady()) {
      return Promise.resolve();
    }

    // New connect attempt (typed) 
    this.connectPromiseToken = token;
    const promise = new Promise<void>((resolve, reject) => {
      // Ensure we start from a clean state
      this.disconnect();

      this.token = token;
      this.setState(WsConnectionState.CONNECTING);

      const wsUrl = this.getWebSocketUrl();
      const url = `${wsUrl}?token=${encodeURIComponent(token)}`;

      let settled = false;
      let handshakeTimer: ReturnType<typeof setTimeout> | undefined;
      let helloFallbackTimer: ReturnType<typeof setTimeout> | undefined;
      let helloSent = false;

      const cleanupTimers = () => {
        if (handshakeTimer) {
          clearTimeout(handshakeTimer);
          handshakeTimer = undefined;
        }
        if (helloFallbackTimer) {
          clearTimeout(helloFallbackTimer);
          helloFallbackTimer = undefined;
        }
      };

      const settle = (err?: unknown) => {
        if (settled) return;
        settled = true;
        cleanupTimers();
        // Clear in-flight promise markers
        this.connectPromise = undefined;
        this.connectPromiseToken = undefined;

        if (err) reject(err);
        else resolve(undefined);
      };

      const sendHello = () => {
        if (helloSent) return;
        helloSent = true;
        this.send({
          event: 'HELLO',
          data: {
            clientInfo: {
              userAgent:
                typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            },
          },
        });
      };

      try {
        this.socket = new WebSocket(url);

        this.socket.addEventListener('open', () => {
          this.setState(WsConnectionState.CONNECTED);
          this.reconnectAttempts = 0;

          this.startHeartbeat();

          // Prefer sending HELLO after server ACKs with CONNECTED; fallback shortly after open.
          helloFallbackTimer = setTimeout(sendHello, 200);

          // If server never replies with HELLO_OK, fail fast so the UI can recover.
          handshakeTimer = setTimeout(() => {
            try {
              this.disconnect();
            } finally {
              settle(new Error(`WebSocket handshake timeout (missing HELLO_OK). url=${wsUrl}`));
            }
          }, 8000);
        });

        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as WsServerMessage;

            // When we receive CONNECTED, the server-side session is initialized.
            if (message.event === 'CONNECTED' && !helloSent) {
              if (helloFallbackTimer) {
                clearTimeout(helloFallbackTimer);
                helloFallbackTimer = undefined;
              }
              sendHello();
            }

            // HELLO_OK completes authentication
            if (message.event === 'HELLO_OK') {
              this.setState(WsConnectionState.AUTHENTICATED);
              settle();
            }

            // If the server indicates an auth/session issue, fail fast.
            if (message.event === 'ERROR') {
              const code = (message as any)?.data?.code;
              const msg = (message as any)?.data?.message;
              if (code === 'NO_SESSION' || code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') {
                try {
                  this.disconnect();
                } finally {
                  settle(new Error(msg || 'WebSocket unauthorized'));
                }
              }
            }

            // Notify all handlers
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.socket.addEventListener('close', (event) => {
          this.stopHeartbeat();
          this.setState(WsConnectionState.DISCONNECTED);

          // If connect() is still pending (handshake not completed), reject it.
          if (!settled) {
            settle(
              new Error(
                `WebSocket closed before handshake (code=${event.code}, reason=${event.reason || 'n/a'}). url=${wsUrl}`
              )
            );
          }

          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.socket.addEventListener('error', (evt) => {
          // In browsers, WebSocket 'error' is often an opaque Event with no useful details (shows as {}).
          // Treat it as a signal and rely on 'close' or the handshake timeout to determine failure.
          // eslint-disable-next-line no-console
          console.warn('WebSocket error event:', evt);

          // If we're still connecting and nothing else happens, the handshake timeout will fire.
          // Do NOT reject here with an empty object, it creates noisy overlays.
        });
      } catch (error) {
        this.setState(WsConnectionState.ERROR);
        settle(error);
      }
    }).finally(() => {
      // Ensure flags are cleared if the promise was consumed without settle() (very defensive)
      if (this.connectPromiseToken === token && this.connectPromise) {
        this.connectPromise = undefined;
        this.connectPromiseToken = undefined;
      }
    });

    this.connectPromise = promise;
    return promise;
  }

  disconnect() {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.socket) {
      try {
        // Normal closure
        this.socket.close(1000, 'Client disconnect');
      } catch {
        // ignore
      } finally {
        this.socket = null;
      }
    }

    this.setState(WsConnectionState.DISCONNECTED);
  }

  send(message: WsClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // eslint-disable-next-line no-console
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  getState(): WsConnectionState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === WsConnectionState.AUTHENTICATED && this.socket?.readyState === WebSocket.OPEN;
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

    // 1) Explicit WS URL (recommended)
    const explicit = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_ENDPOINT;
    if (explicit) {
      const parsed = toWsUrl(explicit);
      if (parsed) return parsed;
    }

    // 2) Backend URL preferred
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      const parsed = toWsUrl(backendUrl);
      if (parsed) return parsed;
    }

    // 3) API URL last resort
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const parsed = toWsUrl(apiUrl);
      if (parsed) {
        // If API URL points to the same origin as the browser (often frontend :3000),
        // assume real WS lives on backend port (default 3001).
        if (typeof window !== 'undefined') {
          try {
            const a = new URL(apiUrl, window.location.origin);
            const sameHost = a.hostname === window.location.hostname;
            const aPort = a.port || (a.protocol === 'https:' ? '443' : '80');
            const wPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
            if (sameHost && aPort === wPort) {
              const backendPort =
                process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.NEXT_PUBLIC_WS_PORT || '3001';
              const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
              return `${proto}//${window.location.hostname}:${backendPort}/ws`;
            }
          } catch {
            // ignore
          }
        }
        return parsed;
      }
    }

    // 4) Final fallback
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.NEXT_PUBLIC_WS_PORT || '3001';
      return `${proto}//${window.location.hostname}:${backendPort}/ws`;
    }

    return 'ws://localhost:3001/ws';
  }

  private setState(state: WsConnectionState) {
    if (this.state !== state) {
      this.state = state;
      this.stateChangeHandlers.forEach((handler) => handler(state));
    }
  }

  private scheduleReconnect() {
    // Avoid stacking multiple reconnect timers
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;

    const expDelay = Math.min(this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1), 30000);
    // add small jitter to avoid thundering herd (0-250ms)
    const jitter = Math.floor(Math.random() * 250);
    const delay = expDelay + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.token) {
        this.connect(this.token).catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ event: 'PING', data: {} });
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

export const wsClient = new WebSocketClient();

/**
 * Access tokens are stored in the NextAuth JWT cookie (encrypted) and are not readable
 * from document.cookie. Use `useSession()` (next-auth/react) and read `session.tokens.accessToken`.
 *
 * @deprecated Use next-auth `useSession()` and `session.tokens.accessToken`.
 */
export function getAccessToken(): string | null {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      'getAccessToken() is deprecated. Use useSession() and session.tokens.accessToken instead.'
    );
  }
  return null;
}
