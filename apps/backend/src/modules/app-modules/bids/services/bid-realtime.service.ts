/**
 * @file bid-realtime.service.ts
 * @description Service for handling real-time bid operations with WebSocket integration
 * @author Suba&Go
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { BidPrismaService } from './bid-prisma.service';
import { AuctionsGateway } from '../../../providers-modules/realtime/auctions.gateway';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Bid, AuctionItem, Auction, Item, User } from '@prisma/client';
import { BidPlacedData } from '@suba-go/shared-validation';

type BidWithRelations = Bid & {
  user: User;
  auctionItem: AuctionItem & {
    auction: Auction;
    item: Item;
  };
};

@Injectable()
export class BidRealtimeService {
  private readonly logger = new Logger(BidRealtimeService.name);

  constructor(
    private readonly bidRepository: BidPrismaService,
    private readonly auctionsGateway: AuctionsGateway,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Place a bid with real-time WebSocket broadcast
   */
  async placeBid(
    auctionItemId: string,
    amount: number,
    userId: string,
    tenantId: string
  ): Promise<BidWithRelations> {
    // Get auction item with relations
    const auctionItem = await this.prisma.auctionItem.findUnique({
      where: { id: auctionItemId },
      include: {
        auction: true,
        item: true,
        bids: {
          orderBy: { offered_price: 'desc' },
          take: 1,
          include: { user: true },
        },
      },
    });

    if (!auctionItem) {
      throw new NotFoundException('Item de subasta no encontrado');
    }

    // Validate tenant access
    if (auctionItem.auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta subasta');
    }

    // Validate auction is active
    if (auctionItem.auction.status !== 'ACTIVA') {
      throw new BadRequestException('La subasta no está activa');
    }

    // Validate auction time
    const now = new Date();
    if (now < auctionItem.auction.startTime) {
      throw new BadRequestException('La subasta aún no ha comenzado');
    }
    if (now > auctionItem.auction.endTime) {
      throw new BadRequestException('La subasta ha finalizado');
    }

    // Validate bid amount
    const highestBid = auctionItem.bids[0];
    const minimumBid = highestBid
      ? Number(highestBid.offered_price) +
        Number(auctionItem.auction.bidIncrement)
      : Number(auctionItem.startingBid);

    if (amount < minimumBid) {
      throw new BadRequestException(
        `La puja debe ser al menos $${minimumBid.toLocaleString()}`
      );
    }

    // Check if user is registered for the auction
    const registration = await this.prisma.auctionRegistration.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId: auctionItem.auctionId,
        },
      },
    });

    if (!registration) {
      throw new ForbiddenException(
        'Debes registrarte en la subasta antes de pujar'
      );
    }

    // Soft-close extension: If bid is placed within last 30 seconds, extend by 30 seconds pass to env.
    const SOFT_CLOSE_THRESHOLD_MS = 30 * 1000; // 2 minutes
    const SOFT_CLOSE_EXTENSION_MS = 30 * 1000; // 2 minutes
    const timeUntilEnd = auctionItem.auction.endTime.getTime() - now.getTime();
    let updatedAuction = auctionItem.auction;

    if (timeUntilEnd <= SOFT_CLOSE_THRESHOLD_MS && timeUntilEnd > 0) {
      const newEndTime = new Date(now.getTime() + SOFT_CLOSE_EXTENSION_MS);

      updatedAuction = await this.prisma.auction.update({
        where: { id: auctionItem.auctionId },
        data: { endTime: newEndTime },
        include: {
          tenant: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      this.logger.log(
        `⏰ Soft-close extension: Auction ${
          auctionItem.auctionId
        } extended to ${newEndTime.toISOString()}`
      );

      // Broadcast time extension to all participants
      this.auctionsGateway.broadcastToRoom(
        `${tenantId}:${auctionItem.auctionId}`,
        {
          event: 'AUCTION_TIME_EXTENDED',
          data: {
            auctionId: auctionItem.auctionId,
            newEndTime: newEndTime.toISOString(),
            extensionSeconds: SOFT_CLOSE_EXTENSION_MS / 1000,
          },
        }
      );
    }

    // Create the bid
    const bid = await this.prisma.bid.create({
      data: {
        offered_price: amount,
        bid_time: new Date(),
        userId,
        auctionId: auctionItem.auctionId,
        auctionItemId,
        tenantId,
      },
      include: {
        user: true,
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
    });

    this.logger.log(
      `Bid placed: ${amount} by ${bid.user.email} on item ${
        auctionItem.item.plate || auctionItemId
      }`
    );

    // Broadcast to all clients in the auction room
    const bidPlacedData: BidPlacedData = {
      tenantId,
      auctionId: auctionItem.auctionId,
      auctionItemId,
      bidId: bid.id,
      amount: Number(bid.offered_price),
      userId: bid.userId,
      userName: bid.user.public_name || bid.user.name || bid.user.email,
      timestamp: bid.bid_time.getTime(),
      item: {
        id: auctionItem.item.id,
        plate: auctionItem.item.plate || undefined,
        brand: auctionItem.item.brand || undefined,
        model: auctionItem.item.model || undefined,
      },
    };

    this.auctionsGateway.broadcastToRoom(
      `${tenantId}:${auctionItem.auctionId}`,
      {
        event: 'BID_PLACED',
        data: bidPlacedData,
      }
    );

    return bid as BidWithRelations;
  }

  /**
   * Get bid history for an auction item
   */
  async getBidHistory(
    auctionItemId: string,
    tenantId: string,
    limit = 50
  ): Promise<BidWithRelations[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionItemId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
      take: limit,
    });

    return bids as BidWithRelations[];
  }

  /**
   * Get highest bid for an auction item
   */
  async getHighestBid(
    auctionItemId: string,
    tenantId: string
  ): Promise<BidWithRelations | null> {
    const bid = await this.prisma.bid.findFirst({
      where: {
        auctionItemId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        offered_price: 'desc',
      },
    });

    return bid as BidWithRelations | null;
  }

  /**
   * Get all bids for an auction
   */
  async getAuctionBids(
    auctionId: string,
    tenantId: string
  ): Promise<BidWithRelations[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
    });

    return bids as BidWithRelations[];
  }

  /**
   * Get user's bids for an auction
   */
  async getUserAuctionBids(
    auctionId: string,
    userId: string,
    tenantId: string
  ): Promise<BidWithRelations[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        userId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
    });

    return bids as BidWithRelations[];
  }

  /**
   * Broadcast auction status change to all participants
   */
  async broadcastAuctionStatusChange(
    auctionId: string,
    tenantId: string,
    status: string
  ) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) return;

    this.auctionsGateway.broadcastToRoom(`${tenantId}:${auctionId}`, {
      event: 'AUCTION_STATUS_CHANGED',
      data: {
        auctionId,
        tenantId,
        status,
        title: auction.title,
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
      },
    });

    this.logger.log(`Auction ${auctionId} status changed to ${status}`);
  }
}
