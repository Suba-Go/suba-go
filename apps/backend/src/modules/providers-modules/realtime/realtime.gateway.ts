/**
 * @file realtime.gateway.ts
 * @description Base WebSocket gateway with heartbeat and double handshake
 * Implements ping/pong heartbeat pattern and HELLO message for session finalization
 * @author Suba&Go
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, WebSocket } from 'ws';
import type { JwtPayload } from '@suba-go/shared-validation';

/**
 * Client metadata stored per connection
 */
interface ClientMeta {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  email?: string;
  role?: string;
  isAlive?: boolean;
}

/**
 * Simple WebSocket gateway that handles:
 * 1. Connection lifecycle (init, connect, disconnect)
 * 2. Heartbeat (ping/pong) to detect dead connections
 * 3. HELLO handshake to finalize session after upgrade
 *
 * This is a basic implementation for testing the double handshake pattern.
 * No auction logic, no rooms, just pure WebSocket connection + authentication.
 */
@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server; // Native ws Server instance

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly clients = new WeakMap<WebSocket, ClientMeta>();
  private heartbeatInterval?: NodeJS.Timeout;

  /**
   * Called once when the gateway is initialized
   * Sets up the heartbeat interval
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Heartbeat: ping all clients every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      let aliveCount = 0;
      let deadCount = 0;

      server.clients.forEach((ws: any) => {
        const meta = this.clients.get(ws) || {};

        // If client didn't respond to last ping, terminate
        if (meta.isAlive === false) {
          deadCount++;
          this.logger.debug(
            `Terminating dead connection: ${meta.email || 'unknown'}`
          );
          return ws.terminate();
        }

        // Mark as potentially dead and send ping
        meta.isAlive = false;
        this.clients.set(ws, meta);
        ws.ping();
        aliveCount++;
      });

      if (aliveCount > 0 || deadCount > 0) {
        this.logger.debug(
          `Heartbeat: ${aliveCount} alive, ${deadCount} terminated`
        );
      }
    }, 30_000); // 30 seconds

    // Clean up interval when server closes
    server.on('close', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  /**
   * Called when a client connects
   * At this point, the client has been authenticated during upgrade
   */
  handleConnection(client: WebSocket) {
    // Extract user info that was attached during upgrade auth
    const user = (client as any).user as JwtPayload | undefined;

    if (!user) {
      this.logger.warn(
        'Client connected without user info - should not happen'
      );
      client.close(1008, 'Unauthorized');
      return;
    }

    // Initialize client metadata
    const meta: ClientMeta = {
      email: user.email,
      role: user.role,
      isAlive: true,
    };

    this.clients.set(client, meta);

    // Set up pong handler to mark client as alive
    client.on('pong', () => {
      const currentMeta = this.clients.get(client);
      if (currentMeta) {
        currentMeta.isAlive = true;
        this.clients.set(client, currentMeta);
      }
    });

    this.logger.log(`Client connected: ${user.email} (role: ${user.role})`);

    // Send initial connection acknowledgment
    this.sendMessage(client, {
      event: 'CONNECTED',
      data: {
        message:
          'WebSocket connection established. Send HELLO to complete handshake.',
        email: user.email,
      },
    });
  }

  /**
   * Called when a client disconnects
   */
  handleDisconnect(client: WebSocket) {
    const meta = this.clients.get(client);
    this.logger.log(`Client disconnected: ${meta?.email || 'unknown'}`);
    this.clients.delete(client);
  }

  /**
   * Second handshake: client sends HELLO to finalize session
   * This allows the client to send additional context or confirm readiness
   */
  @SubscribeMessage('HELLO')
  handleHello(
    @MessageBody() body: { token?: string; clientInfo?: any },
    @ConnectedSocket() client: WebSocket
  ) {
    const meta = this.clients.get(client);

    if (!meta) {
      this.sendMessage(client, {
        event: 'ERROR',
        data: { code: 'NO_SESSION', message: 'No session found' },
      });
      return;
    }

    this.logger.log(`HELLO received from ${meta.email}`);

    // Send success response
    this.sendMessage(client, {
      event: 'HELLO_OK',
      data: {
        ok: true,
        user: {
          email: meta.email,
          role: meta.role,
          userId: meta.userId,
          tenantId: meta.tenantId,
        },
      },
    });
  }

  /**
   * Helper to send a message to a client
   */
  protected sendMessage(client: WebSocket, message: any) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Helper to broadcast to all connected clients
   */
  protected broadcast(message: any) {
    const payload = JSON.stringify(message);
    this.server.clients.forEach((client) => {
      if (client.readyState === 1 /* OPEN */) {
        client.send(payload);
      }
    });
  }

  /**
   * Get client metadata
   */
  protected getClientMeta(client: WebSocket): ClientMeta | undefined {
    return this.clients.get(client);
  }

  /**
   * Update client metadata
   */
  protected setClientMeta(client: WebSocket, meta: ClientMeta) {
    this.clients.set(client, meta);
  }

  /**
   * Get all clients
   */
  protected getAllClients(): Set<WebSocket> {
    return this.server.clients;
  }
}
