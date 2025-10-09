import { Test, TestingModule } from '@nestjs/testing';
import { BidsService } from './bids.service';
import { BidPrismaService } from './bid-prisma.service';
import { WebSocketService } from '../../websocket/services/websocket.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BidsService', () => {
  let service: BidsService;
  let mockBidRepository: jest.Mocked<BidPrismaService>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;

  const mockBid = {
    id: '1',
    offered_price: 100000,
    bid_time: new Date(),
    userId: 'user1',
    tenantId: 'tenant1',
    auctionId: 'auction1',
    auctionItemId: 'item1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
    user: {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      public_name: 'TestUser',
    },
    auctionItem: {
      id: 'item1',
      auctionId: 'auction1',
      item: {
        id: 'item1',
        name: 'Test Item',
        basePrice: 50000,
      },
      auction: {
        id: 'auction1',
        status: 'ACTIVE',
        title: 'Test Auction',
      },
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      createBid: jest.fn(),
      findBidsByAuctionItem: jest.fn(),
      findBidsByAuction: jest.fn(),
      findBidsByUser: jest.fn(),
      findHighestBidForItem: jest.fn(),
      findBidById: jest.fn(),
      updateBid: jest.fn(),
      deleteBid: jest.fn(),
      getBidStats: jest.fn(),
      getWinningBids: jest.fn(),
      validateBidAmount: jest.fn(),
      prisma: {
        auctionItem: {
          findUnique: jest.fn(),
        },
      },
    };

    const mockWebSocket = {
      emitBidUpdate: jest.fn(),
      emitBidDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidsService,
        {
          provide: BidPrismaService,
          useValue: mockRepository,
        },
        {
          provide: WebSocketService,
          useValue: mockWebSocket,
        },
      ],
    }).compile();

    service = module.get<BidsService>(BidsService);
    mockBidRepository = module.get(BidPrismaService);
    mockWebSocketService = module.get(WebSocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBid', () => {
    it('should create a bid successfully', async () => {
      const createBidDto = {
        auctionItemId: 'item1',
        offeredPrice: 100000,
      };

      mockBidRepository.validateBidAmount.mockResolvedValue({
        isValid: true,
        minimumBid: 75000,
      });

      mockBidRepository['prisma'].auctionItem.findUnique.mockResolvedValue({
        auctionId: 'auction1',
      });

      mockBidRepository.createBid.mockResolvedValue(mockBid);

      const result = await service.createBid(createBidDto, 'user1', 'tenant1');

      expect(result).toEqual(mockBid);
      expect(mockBidRepository.validateBidAmount).toHaveBeenCalledWith('item1', 100000);
      expect(mockBidRepository.createBid).toHaveBeenCalled();
      expect(mockWebSocketService.emitBidUpdate).toHaveBeenCalledWith(mockBid);
    });

    it('should throw BadRequestException if bid amount is invalid', async () => {
      const createBidDto = {
        auctionItemId: 'item1',
        offeredPrice: 50000,
      };

      mockBidRepository.validateBidAmount.mockResolvedValue({
        isValid: false,
        minimumBid: 75000,
        message: 'La oferta debe ser al menos $75,000',
      });

      await expect(
        service.createBid(createBidDto, 'user1', 'tenant1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if auction item not found', async () => {
      const createBidDto = {
        auctionItemId: 'item1',
        offeredPrice: 100000,
      };

      mockBidRepository.validateBidAmount.mockResolvedValue({
        isValid: true,
        minimumBid: 75000,
      });

      mockBidRepository['prisma'].auctionItem.findUnique.mockResolvedValue(null);

      await expect(
        service.createBid(createBidDto, 'user1', 'tenant1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBidById', () => {
    it('should return bid if found and belongs to tenant', async () => {
      mockBidRepository.findBidById.mockResolvedValue(mockBid);

      const result = await service.getBidById('1', 'tenant1');

      expect(result).toEqual(mockBid);
      expect(mockBidRepository.findBidById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if bid not found', async () => {
      mockBidRepository.findBidById.mockResolvedValue(null);

      await expect(service.getBidById('1', 'tenant1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if bid belongs to different tenant', async () => {
      const bidFromDifferentTenant = { ...mockBid, tenantId: 'tenant2' };
      mockBidRepository.findBidById.mockResolvedValue(bidFromDifferentTenant);

      await expect(service.getBidById('1', 'tenant1')).rejects.toThrow();
    });
  });

  describe('getBidStats', () => {
    it('should return bid statistics', async () => {
      const mockStats = {
        totalBids: 50,
        activeBids: 15,
        totalBidValue: 2500000,
        averageBidValue: 50000,
        uniqueBidders: 12,
      };

      mockBidRepository.getBidStats.mockResolvedValue(mockStats);

      const result = await service.getBidStats('tenant1');

      expect(result).toEqual(mockStats);
      expect(mockBidRepository.getBidStats).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('getMinimumBidAmount', () => {
    it('should return minimum bid amount', async () => {
      mockBidRepository.validateBidAmount.mockResolvedValue({
        isValid: true,
        minimumBid: 75000,
      });

      const result = await service.getMinimumBidAmount('item1');

      expect(result).toBe(75000);
      expect(mockBidRepository.validateBidAmount).toHaveBeenCalledWith('item1', 0);
    });
  });
});
