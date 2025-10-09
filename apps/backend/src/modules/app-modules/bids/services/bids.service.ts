import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BidPrismaService } from './bid-prisma.service';
import { CreateBidDto, BidStatsDto } from '../dto/bid.dto';
import { WebSocketService } from '../../websocket/services/websocket.service';
import type { Bid, AuctionItem, Auction, Item } from '@prisma/client';

type BidWithRelations = Bid & {
  auctionItem: AuctionItem & {
    auction: Auction;
    item: Item;
  };
};

@Injectable()
export class BidsService {
  constructor(
    private readonly bidRepository: BidPrismaService,
    @Inject(forwardRef(() => WebSocketService))
    private readonly websocketService: WebSocketService
  ) {}

  async createBid(
    createBidDto: CreateBidDto,
    userId: string,
    tenantId: string
  ): Promise<Bid> {
    // Validate bid amount
    const validation = await this.bidRepository.validateBidAmount(
      createBidDto.auctionItemId,
      createBidDto.offeredPrice
    );

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    // Get auction ID from auction item
    const auctionItem = await this.bidRepository[
      'prisma'
    ].auctionItem.findUnique({
      where: { id: createBidDto.auctionItemId },
      select: { auctionId: true },
    });

    if (!auctionItem) {
      throw new BadRequestException('Item de subasta no encontrado');
    }

    // Create the bid
    const bid = await this.bidRepository.createBid({
      offered_price: createBidDto.offeredPrice,
      bid_time: new Date(),
      user: {
        connect: { id: userId },
      },
      auction: {
        connect: { id: auctionItem.auctionId },
      },
      auctionItem: {
        connect: { id: createBidDto.auctionItemId },
      },
      tenant: {
        connect: { id: tenantId },
      },
    });

    // Emit WebSocket event for real-time updates
    this.websocketService.emitBidUpdate({
      ...bid,
      offered_price: Number(bid.offered_price),
      bid_time: bid.bid_time.toISOString(),
    });

    return bid;
  }

  async getBidsByAuctionItem(
    auctionItemId: string,
    tenantId: string
  ): Promise<Bid[]> {
    const bids = await this.bidRepository.findBidsByAuctionItem(auctionItemId);

    // Validate that all bids belong to the tenant
    const validBids = bids.filter((bid) => bid.tenantId === tenantId);

    return validBids;
  }

  async getBidsByAuction(auctionId: string, tenantId: string): Promise<Bid[]> {
    const bids = await this.bidRepository.findBidsByAuction(auctionId);

    // Validate that all bids belong to the tenant
    const validBids = bids.filter((bid) => bid.tenantId === tenantId);

    return validBids;
  }

  async getBidsByUser(userId: string, tenantId: string): Promise<Bid[]> {
    return this.bidRepository.findBidsByUser(userId, tenantId);
  }

  async getHighestBidForItem(
    auctionItemId: string,
    tenantId: string
  ): Promise<Bid | null> {
    const bid = await this.bidRepository.findHighestBidForItem(auctionItemId);

    if (bid && bid.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta puja');
    }

    return bid;
  }

  async getBidById(id: string, tenantId: string): Promise<BidWithRelations> {
    const bid = await this.bidRepository.findBidById(id);

    if (!bid) {
      throw new NotFoundException('Puja no encontrada');
    }

    if (bid.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta puja');
    }

    return bid as BidWithRelations;
  }

  async updateBid(
    id: string,
    offeredPrice: number,
    userId: string,
    tenantId: string
  ): Promise<Bid> {
    const existingBid = await this.getBidById(id, tenantId);

    // Only the bid owner can update their bid
    if (existingBid.userId !== userId) {
      throw new ForbiddenException('Solo puedes actualizar tus propias pujas');
    }

    // Check if auction is still active
    if (existingBid.auctionItem.auction.status !== 'ACTIVE') {
      throw new BadRequestException(
        'No se puede actualizar una puja en una subasta inactiva'
      );
    }

    // Validate new bid amount
    const validation = await this.bidRepository.validateBidAmount(
      existingBid.auctionItemId,
      offeredPrice
    );

    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    const updatedBid = await this.bidRepository.updateBid(id, {
      offered_price: offeredPrice,
    });

    // Emit WebSocket event for real-time updates
    this.websocketService.emitBidUpdate({
      ...updatedBid,
      offered_price: Number(updatedBid.offered_price),
      bid_time: updatedBid.bid_time.toISOString(),
    });

    return updatedBid;
  }

  async deleteBid(id: string, userId: string, tenantId: string): Promise<void> {
    const bid = await this.getBidById(id, tenantId);

    // Only the bid owner can delete their bid
    if (bid.userId !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propias pujas');
    }

    // Check if auction is still active
    if (bid.auctionItem.auction.status !== 'ACTIVE') {
      throw new BadRequestException(
        'No se puede eliminar una puja en una subasta inactiva'
      );
    }

    await this.bidRepository.deleteBid(id);

    // Emit WebSocket event for real-time updates
    const auctionId = bid.auctionItem.auction.id;
    this.websocketService.emitBidDelete(id, auctionId);
  }

  async getBidStats(tenantId: string): Promise<BidStatsDto> {
    const stats = await this.bidRepository.getBidStats(tenantId);

    return {
      totalBids: stats.totalBids,
      activeBids: stats.activeBids,
      totalBidValue: stats.totalBidValue,
      averageBidValue: stats.averageBidValue,
      uniqueBidders: stats.uniqueBidders,
    };
  }

  async getWinningBids(): Promise<Bid[]> {
    // TODO: Implement winning bids logic
    return [];
  }

  async validateUserCanBid(): Promise<boolean> {
    // TODO: Implement proper validation
    // - Check if user belongs to tenant
    // - Check if auction is active
    // - Check if user is not the auction manager
    // - Check if user hasn't exceeded bid limits

    return true;
  }

  async getBidHistory(
    auctionItemId: string,
    tenantId: string,
    limit = 10
  ): Promise<Bid[]> {
    const bids = await this.bidRepository.findBidsByAuctionItem(auctionItemId);

    // Validate tenant access
    const validBids = bids.filter((bid) => bid.tenantId === tenantId);

    // Return limited results
    return validBids.slice(0, limit);
  }

  async getMinimumBidAmount(auctionItemId: string): Promise<number> {
    const validation = await this.bidRepository.validateBidAmount(
      auctionItemId,
      0
    );
    return validation.minimumBid;
  }
}
