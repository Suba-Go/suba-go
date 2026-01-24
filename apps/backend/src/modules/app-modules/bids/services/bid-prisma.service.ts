/**
 * @file bid-prisma.service.ts
 * @description Repository service for bid database operations
 * Provides CRUD operations and queries for bids using Prisma
 * @author Suba&Go
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { Bid as BidModel } from '@prisma/client';

/**
 * Use Prisma payload types for queries that include relations.
 * This prevents TypeScript errors like "Property 'user' does not exist on type 'Bid'"
 * when the query uses `include` / `select`.
 */
const bidWithDetailsArgs = Prisma.validator<Prisma.BidDefaultArgs>()({
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
        item: true,
        auction: true,
      },
    },
  },
});

export type BidWithDetails = Prisma.BidGetPayload<typeof bidWithDetailsArgs>;

@Injectable()
export class BidPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async createBid(data: Prisma.BidCreateInput): Promise<BidWithDetails> {
    return this.prisma.bid.create({
      data,
      ...bidWithDetailsArgs,
    });
  }

  async findBidsByAuctionItem(
    auctionItemId: string,
  ): Promise<BidWithDetails[]> {
    return this.prisma.bid.findMany({
      where: {
        auctionItemId,
        isDeleted: false,
      },
      ...bidWithDetailsArgs,
      orderBy: {
        offered_price: 'desc',
      },
    });
  }

  async findBidsByAuction(auctionId: string): Promise<BidWithDetails[]> {
    return this.prisma.bid.findMany({
      where: {
        auctionItem: {
          auctionId,
        },
        isDeleted: false,
      },
      ...bidWithDetailsArgs,
      orderBy: {
        offered_price: 'desc',
      },
    });
  }

  async findBidsByUser(
    userId: string,
    tenantId: string,
  ): Promise<BidWithDetails[]> {
    return this.prisma.bid.findMany({
      where: {
        userId,
        tenantId,
        isDeleted: false,
      },
      ...bidWithDetailsArgs,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findHighestBidForItem(
    auctionItemId: string,
  ): Promise<BidWithDetails | null> {
    return this.prisma.bid.findFirst({
      where: {
        auctionItemId,
        isDeleted: false,
      },
      ...bidWithDetailsArgs,
      orderBy: {
        offered_price: 'desc',
      },
    });
  }

  async findBidById(id: string): Promise<BidWithDetails | null> {
    return this.prisma.bid.findUnique({
      where: { id },
      ...bidWithDetailsArgs,
    });
  }

  async updateBid(
    id: string,
    data: Prisma.BidUpdateInput,
  ): Promise<BidWithDetails> {
    return this.prisma.bid.update({
      where: { id },
      data,
      ...bidWithDetailsArgs,
    });
  }

  async deleteBid(id: string): Promise<BidModel> {
    return this.prisma.bid.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getBidStats(tenantId: string): Promise<{
    totalBids: number;
    activeBids: number;
    totalBidValue: number;
    averageBidValue: number;
    uniqueBidders: number;
  }> {
    const [totalBids, activeBids, bidValueResult, uniqueBidders] =
      await Promise.all([
        // Total bids
        this.prisma.bid.count({
          where: {
            tenantId,
            isDeleted: false,
          },
        }),

        // Active bids (in active auctions)
        this.prisma.bid.count({
          where: {
            tenantId,
            isDeleted: false,
            auctionItem: {
              auction: {
                status: 'ACTIVA',
                isDeleted: false,
              },
            },
          },
        }),

        // Total bid value
        this.prisma.bid.aggregate({
          where: {
            tenantId,
            isDeleted: false,
          },
          _sum: {
            offered_price: true,
          },
        }),

        // Unique bidders
        this.prisma.bid.findMany({
          where: {
            tenantId,
            isDeleted: false,
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        }),
      ]);

    const totalBidValue = Number(bidValueResult._sum.offered_price) || 0;
    const averageBidValue = totalBids > 0 ? totalBidValue / totalBids : 0;

    return {
      totalBids,
      activeBids,
      totalBidValue,
      averageBidValue: Math.round(averageBidValue * 100) / 100,
      uniqueBidders: uniqueBidders.length,
    };
  }

  async getWinningBids(auctionId: string): Promise<BidWithDetails[]> {
    // Get the highest bid for each item in the auction
    const auctionItems = await this.prisma.auctionItem.findMany({
      where: {
        auctionId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const winningBids: BidWithDetails[] = [];
    for (const item of auctionItems) {
      const highestBid = await this.findHighestBidForItem(item.id);
      if (highestBid) {
        winningBids.push(highestBid);
      }
    }

    return winningBids;
  }

  async validateBidAmount(
    auctionItemId: string,
    bidAmount: number
  ): Promise<{
    isValid: boolean;
    currentHighestBid?: number;
    minimumBid: number;
    message?: string;
  }> {
    const [auctionItem, highestBid] = await Promise.all([
      this.prisma.auctionItem.findUnique({
        where: { id: auctionItemId },
        include: {
          item: true,
          auction: true,
        },
      }),
      this.findHighestBidForItem(auctionItemId),
    ]);

    if (!auctionItem) {
      return {
        isValid: false,
        minimumBid: 0,
        message: 'Item de subasta no encontrado',
      };
    }

    if (auctionItem.auction.status !== 'ACTIVA') {
      return {
        isValid: false,
        minimumBid: 0,
        message: 'La subasta no está activa',
      };
    }

    const currentHighestBid = highestBid ? Number(highestBid.offered_price) : 0;
    const basePrice = Number(auctionItem.item.basePrice) || 0;
    const minimumBid = Math.max(currentHighestBid + 50000, basePrice); // Minimum increment of 50,000

    if (bidAmount < minimumBid) {
      return {
        isValid: false,
        currentHighestBid,
        minimumBid,
        message: `La oferta debe ser al menos $${minimumBid.toLocaleString()}`,
      };
    }

    return {
      isValid: true,
      currentHighestBid,
      minimumBid,
    };
  }
}
