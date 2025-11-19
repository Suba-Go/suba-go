/**
 * @file ws-auth.adapter.ts
 * @description Custom WebSocket adapter that integrates upgrade-time authentication
 * Extends NestJS WsAdapter to add JWT authentication during the HTTP upgrade event
 * @author Suba&Go
 */
import { INestApplicationContext, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { WebSocketServer } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export class WsAuthAdapter extends WsAdapter {
  protected readonly logger = new Logger(WsAuthAdapter.name);
  private jwtService: JwtService;
  private configService: ConfigService;
  private app: INestApplicationContext;

  constructor(app: INestApplicationContext) {
    super(app);

    this.app = app;

    // Get services from DI container
    this.jwtService = app.get(JwtService);
    this.configService = app.get(ConfigService);

    this.logger.log('WsAuthAdapter initialized with JWT authentication');
  }

  /**
   * Call this after the application has started to bind authentication
   * This ensures the HTTP server is available
   */
  public bindAuthenticationAfterInit() {
    this.logger.log('Binding authentication after application init');

    // Try multiple ways to get the HTTP server
    let httpServer = (this as any).httpServer?.getHttpServer?.();

    // If not found, try to get it from the app
    if (!httpServer && this.app) {
      try {
        const nestApp = this.app as any;
        httpServer =
          nestApp.getHttpServer?.() || nestApp.httpAdapter?.getHttpServer?.();
      } catch (error) {
        this.logger.debug('Could not get HTTP server from app', error);
      }
    }

    // If still not found, try to get it from the WebSocket server
    if (!httpServer) {
      const wsServer = (this as any).wsServer;
      if (wsServer && (wsServer as any)._server) {
        httpServer = (wsServer as any)._server;
        this.logger.debug('Got HTTP server from WebSocket server');
      }
    }

    const pendingServer = (this as any).pendingServer;
    const pendingCallback = (this as any).pendingCallback;

    if (!httpServer) {
      this.logger.warn(
        'HTTP server not available yet - WebSocket auth will be set up on first connection'
      );
      return;
    }

    if (!pendingServer || !pendingCallback) {
      this.logger.log(
        'No pending WebSocket server - auth already set up or no WebSocket gateway registered'
      );
      return;
    }

    this.logger.log('Setting up authentication for pending WebSocket server');
    this.setupAuthenticatedUpgrade(httpServer, pendingServer, pendingCallback);
  }

  create(port: number, options?: any): any {
    // CRITICAL FIX: Remove namespace property to prevent "WsAdapter does not support namespaces" error
    // NestJS passes this even when we don't use namespaces
    const { namespace, ...cleanOptions } = options || {};

    if (namespace) {
      this.logger.warn(
        `Ignoring namespace "${namespace}" - native ws adapter doesn't support namespaces`
      );
    }

    // Call parent to create the WebSocket server with cleaned options
    const server = super.create(port, cleanOptions) as WebSocketServer & {
      _server?: any;
    };

    // Store the WebSocket server for later use in bindClientConnect
    (this as any).wsServer = server;

    return server;
  }

  /**
   * Override bindClientConnect to inject authentication BEFORE the connection event
   * This is called by NestJS after the HTTP server is set up
   */
  bindClientConnect(
    server: WebSocketServer,
    callback: (...args: any[]) => void
  ) {
    this.logger.log('Setting up authenticated WebSocket connections');

    // Store callback for later - we'll set up auth when HTTP server is ready
    (this as any).pendingCallback = callback;
    (this as any).pendingServer = server;

    // Try multiple ways to get the HTTP server
    const httpServer =
      (this as any).httpServer?.getHttpServer?.() || // NestJS Express
      (this as any).httpServer || // Direct reference
      (server as any)._server; // ws library internal

    if (!httpServer) {
      this.logger.warn(
        'HTTP server not available yet - will set up auth after server starts'
      );
      // Call parent to set up basic connection handling
      // We'll override the upgrade handler in afterInit
      return super.bindClientConnect(server, callback);
    }

    this.logger.log('HTTP server found - binding upgrade authentication');
    this.setupAuthenticatedUpgrade(httpServer, server, callback);
  }

  /**
   * Set up the authenticated upgrade handler
   */
  private setupAuthenticatedUpgrade(
    httpServer: any,
    server: WebSocketServer,
    callback: (...args: any[]) => void
  ) {
    // Remove all existing 'upgrade' listeners that NestJS added
    const existingListeners = httpServer.listeners('upgrade');
    this.logger.debug(
      `Removing ${existingListeners.length} existing upgrade listeners`
    );
    httpServer.removeAllListeners('upgrade');

    // Add our custom upgrade handler with authentication
    httpServer.on('upgrade', (request: any, socket: any, head: Buffer) => {
      const url = new URL(request.url!, 'http://localhost');

      // Only handle /ws path
      if (!url.pathname.startsWith('/ws')) {
        this.logger.debug(`Ignoring non-WebSocket upgrade: ${url.pathname}`);
        socket.destroy();
        return;
      }

      this.logger.debug('Processing WebSocket upgrade with authentication');

      // Extract and verify token
      const token = this.extractToken(request);

      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        // Verify JWT token
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });

        if (!payload || !payload.email) {
          this.logger.warn(
            'WebSocket connection rejected: Invalid token payload'
          );
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.logger.log(`WebSocket upgrade authenticated: ${payload.email}`);

        // Attach user info to request
        (request as any).user = payload;

        // Handle the upgrade and attach user to WebSocket
        server.handleUpgrade(request, socket, head, (ws: any) => {
          ws.user = payload; // Attach user to WebSocket instance
          server.emit('connection', ws, request);
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Token verification failed';
        this.logger.warn(`WebSocket connection rejected: ${message}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });

    // Call the original callback for each connection
    server.on('connection', callback);
  }

  /**
   * Extract JWT token from request
   */
  private extractToken(request: any): string | undefined {
    const url = new URL(request.url!, 'http://localhost');

    // 1. Query parameter
    const queryToken = url.searchParams.get('token');
    if (queryToken) return queryToken;

    // 2. Authorization header
    const authHeader = request.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) return match[1];
    }

    // 3. Cookie
    const cookieHeader = request.headers['cookie'];
    if (cookieHeader && typeof cookieHeader === 'string') {
      const cookies = cookieHeader.split(';').map((c: string) => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'token' || name === 'accessToken') {
          return value;
        }
      }
    }

    return undefined;
  }
}
