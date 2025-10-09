import { Test, TestingModule } from '@nestjs/testing';
import { AuctionWebSocketGateway } from './auction-websocket.gateway';
import { WebSocketService } from '../services/websocket.service';
import { Socket } from 'socket.io';

describe('AuctionWebSocketGateway', () => {
  let gateway: AuctionWebSocketGateway;
  let mockWebSocketService: jest.Mocked<WebSocketService>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const mockService = {
      setServer: jest.fn(),
      addClient: jest.fn(),
      removeClient: jest.fn(),
      getClient: jest.fn(),
      joinAuctionRoom: jest.fn(),
      leaveAuctionRoom: jest.fn(),
      joinTenantRoom: jest.fn(),
      leaveTenantRoom: jest.fn(),
      validateAuctionAccess: jest.fn(),
      getAuctionParticipantCount: jest.fn(),
      emitParticipantCount: jest.fn(),
    };

    mockSocket = {
      id: 'socket1',
      handshake: {
        query: {
          userId: 'user1',
          tenantId: 'tenant1',
        },
        auth: {
          token: 'valid-token',
        },
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
    } as unknown;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionWebSocketGateway,
        {
          provide: WebSocketService,
          useValue: mockService,
        },
      ],
    }).compile();

    gateway = module.get<AuctionWebSocketGateway>(AuctionWebSocketGateway);
    mockWebSocketService = module.get(WebSocketService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should accept valid connection', async () => {
      await gateway.handleConnection(mockSocket);

      expect(mockWebSocketService.addClient).toHaveBeenCalledWith('socket1', {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
      });
      expect(mockWebSocketService.joinTenantRoom).toHaveBeenCalledWith(
        'socket1',
        'tenant1'
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        message: 'Conectado exitosamente al sistema de subastas',
        clientId: 'socket1',
      });
    });

    it('should reject connection without userId', async () => {
      mockSocket.handshake.query.userId = undefined;

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockWebSocketService.addClient).not.toHaveBeenCalled();
    });

    it('should reject connection without tenantId', async () => {
      mockSocket.handshake.query.tenantId = undefined;

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockWebSocketService.addClient).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnection properly', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
        auctionId: 'auction1',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);

      gateway.handleDisconnect(mockSocket);

      expect(mockWebSocketService.leaveAuctionRoom).toHaveBeenCalledWith(
        'socket1',
        'auction1'
      );
      expect(mockWebSocketService.leaveTenantRoom).toHaveBeenCalledWith(
        'socket1',
        'tenant1'
      );
      expect(mockWebSocketService.removeClient).toHaveBeenCalledWith('socket1');
    });

    it('should handle disconnection without auction room', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);

      gateway.handleDisconnect(mockSocket);

      expect(mockWebSocketService.leaveAuctionRoom).not.toHaveBeenCalled();
      expect(mockWebSocketService.leaveTenantRoom).toHaveBeenCalledWith(
        'socket1',
        'tenant1'
      );
      expect(mockWebSocketService.removeClient).toHaveBeenCalledWith('socket1');
    });
  });

  describe('handleJoinAuction', () => {
    it('should join auction room successfully', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);
      mockWebSocketService.validateAuctionAccess.mockReturnValue(true);
      mockWebSocketService.getAuctionParticipantCount.mockReturnValue(5);

      gateway.handleJoinAuction(mockSocket, { auctionId: 'auction1' });

      expect(mockWebSocketService.joinAuctionRoom).toHaveBeenCalledWith(
        'socket1',
        'auction1'
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('auctionJoined', {
        auctionId: 'auction1',
        participantCount: 5,
      });
      expect(mockWebSocketService.emitParticipantCount).toHaveBeenCalledWith(
        'auction1',
        5
      );
    });

    it('should reject join if client not authenticated', () => {
      mockWebSocketService.getClient.mockReturnValue(undefined);

      gateway.handleJoinAuction(mockSocket, { auctionId: 'auction1' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Cliente no autenticado',
      });
      expect(mockWebSocketService.joinAuctionRoom).not.toHaveBeenCalled();
    });

    it('should reject join if no auction access', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);
      mockWebSocketService.validateAuctionAccess.mockReturnValue(false);

      gateway.handleJoinAuction(mockSocket, { auctionId: 'auction1' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Sin acceso a esta subasta',
      });
      expect(mockWebSocketService.joinAuctionRoom).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveAuction', () => {
    it('should leave auction room successfully', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
        auctionId: 'auction1',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);
      mockWebSocketService.getAuctionParticipantCount.mockReturnValue(4);

      gateway.handleLeaveAuction(mockSocket, { auctionId: 'auction1' });

      expect(mockWebSocketService.leaveAuctionRoom).toHaveBeenCalledWith(
        'socket1',
        'auction1'
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('auctionLeft', {
        auctionId: 'auction1',
      });
      expect(mockWebSocketService.emitParticipantCount).toHaveBeenCalledWith(
        'auction1',
        4
      );
    });

    it('should not leave if auction IDs do not match', () => {
      const mockClient = {
        socket: mockSocket,
        userId: 'user1',
        tenantId: 'tenant1',
        auctionId: 'auction2',
      };

      mockWebSocketService.getClient.mockReturnValue(mockClient);

      gateway.handleLeaveAuction(mockSocket, { auctionId: 'auction1' });

      expect(mockWebSocketService.leaveAuctionRoom).not.toHaveBeenCalled();
    });
  });

  describe('handlePing', () => {
    it('should respond to ping with pong', () => {
      gateway.handlePing(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('pong', {
        timestamp: expect.any(String),
      });
    });
  });
});
