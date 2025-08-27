import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Auction, Bid } from '@prisma/client';

@Injectable()
export class AuctionPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new auction
  async createAuction(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    tenantId: string;
  }): Promise<Auction> {
    return this.prisma.auction.create({
      data,
      include: {
        tenant: true,
        items: {
          include: {
            item: true,
            bids: {
              include: {
                user: true,
              },
              orderBy: {
                offered_price: 'desc',
              },
            },
          },
        },
      },
    });
  }

  // Get auction with all related data
  async getAuctionById(id: string): Promise<Auction | null> {
    return this.prisma.auction.findUnique({
      where: { id },
      include: {
        tenant: true,
        items: {
          include: {
            item: true,
            bids: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    // Don't include password
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });
  }

  // Get active auctions for a tenant
  async getActiveAuctions(tenantId: string): Promise<Auction[]> {
    const now = new Date();

    return this.prisma.auction.findMany({
      where: {
        tenantId,
        startTime: { lte: now },
        endTime: { gte: now },
        status: 'ACTIVE',
        isDeleted: false,
      },
      include: {
        items: {
          include: {
            item: true,
            bids: {
              take: 1,
              orderBy: {
                offered_price: 'desc',
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        endTime: 'asc',
      },
    });
  }

  // Place a bid (with optimistic locking)
  async placeBid(data: {
    userId: string;
    auctionId: string;
    auctionItemId: string;
    amount: number;
  }): Promise<Bid> {
    return this.prisma.executeTransaction(async (prisma) => {
      // Check if auction is still active
      const auction = await prisma.auction.findUnique({
        where: { id: data.auctionId },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      const now = new Date();
      if (now < auction.startTime || now > auction.endTime) {
        throw new Error('Auction is not active');
      }

      // Get current highest bid
      const highestBid = await prisma.bid.findFirst({
        where: {
          auctionItemId: data.auctionItemId,
          isDeleted: false,
        },
        orderBy: {
          amount: 'desc',
        },
      });

      // Validate bid amount
      if (highestBid && data.amount <= Number(highestBid.amount)) {
        throw new Error('Bid amount must be higher than current highest bid');
      }

      // Create the bid
      return prisma.bid.create({
        data: {
          userId: data.userId,
          auctionId: data.auctionId,
          auctionItemId: data.auctionItemId,
          amount: data.amount,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          auctionItem: {
            include: {
              item: true,
            },
          },
        },
      });
    });
  }

  // Get bid history for an auction item
  async getBidHistory(auctionItemId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: {
        auctionItemId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get user's bids
  async getUserBids(userId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        auctionItem: {
          include: {
            item: true,
            auction: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Close auction and determine winners
  async closeAuction(auctionId: string): Promise<Auction> {
    return this.prisma.executeTransaction(async (prisma) => {
      // Update auction status
      const auction = await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'CLOSED' },
        include: {
          items: {
            include: {
              bids: {
                orderBy: {
                  amount: 'desc',
                },
                take: 1,
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      // Here you could add logic to:
      // - Send notifications to winners
      // - Update item statuses
      // - Create audit logs
      // - Process payments

      return auction;
    });
  }
}
