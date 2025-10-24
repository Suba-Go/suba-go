/**
 * @file ws-client.ts
 * @description WebSocket client utility with double handshake support
 * Manages connection lifecycle, authentication, and message handling
 * @author Suba&Go
 */
import {
  WsConnectionState,
  type WsClientMessage,
  type WsServerMessage,
} from '@suba-go/shared-validation';

type MessageHandler = (message: WsServerMessage) => void;
type StateChangeHandler = (state: WsConnectionState) => void;

/**
 * WebSocket client manager
 * Handles connection, authentication, reconnection, and message routing
 */
class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();
  private state: WsConnectionState = WsConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private token?: string;

  /**
   * Connect to WebSocket server with authentication
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.token = token;
      this.setState(WsConnectionState.CONNECTING);

      // Get WebSocket URL from environment
      const wsUrl = this.getWebSocketUrl();
      const url = `${wsUrl}?token=${encodeURIComponent(token)}`;

      try {
        this.socket = new WebSocket(url);

        this.socket.addEventListener('open', () => {
          this.setState(WsConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Send HELLO message to complete double handshake
          this.send({
            event: 'HELLO',
            data: { clientInfo: { userAgent: navigator.userAgent } },
          });

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        });

        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data) as WsServerMessage;

            // Handle HELLO_OK to complete authentication
            if (message.event === 'HELLO_OK') {
              this.setState(WsConnectionState.AUTHENTICATED);
            }

            // Notify all handlers
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.socket.addEventListener('close', (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.setState(WsConnectionState.DISCONNECTED);
          this.stopHeartbeat();

          // Attempt reconnection if not a normal closure
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        });

        this.socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          this.setState(WsConnectionState.ERROR);
          reject(error);
        });
      } catch (error) {
        this.setState(WsConnectionState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.setState(WsConnectionState.DISCONNECTED);
  }

  /**
   * Send a message to the server
   */
  send(message: WsClientMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Subscribe to incoming messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  /**
   * Get current connection state
   */
  getState(): WsConnectionState {
    return this.state;
  }

  /**
   * Check if connected and authenticated
   */
  isReady(): boolean {
    return (
      this.state === 'AUTHENTICATED' &&
      this.socket?.readyState === WebSocket.OPEN
    );
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    // Check if we have an explicit WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) return wsUrl;

    // Otherwise, derive from API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    if (apiUrl) {
      // Convert http(s) to ws(s)
      return apiUrl.replace(/^http/, 'ws') + '/ws';
    }

    // Fallback to localhost
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.hostname}:3001/ws`;
    }

    return 'ws://localhost:3001/ws';
  }

  /**
   * Update connection state and notify handlers
   */
  private setState(state: WsConnectionState) {
    if (this.state !== state) {
      this.state = state;
      this.stateChangeHandlers.forEach((handler) => handler(state));
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat();

    // Send ping every 25 seconds (server expects pong within 30s)
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ event: 'PING', data: {} });
      }
    }, 25000);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

/**
 * Helper to get access token from session/cookie
 * This should be adapted to your auth implementation
 */
export function getAccessToken(): string | null {
  // Try to get from cookie
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken' || name === 'token') {
        return value;
      }
    }
  }

  // Try to get from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('accessToken');
  }

  return null;
}
