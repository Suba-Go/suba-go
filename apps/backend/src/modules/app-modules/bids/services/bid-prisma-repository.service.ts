import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Bid, Prisma } from '@prisma/client';

@Injectable()
export class BidPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BidCreateInput): Promise<Bid> {
    return this.prisma.bid.create({
      data,
      include: {
        tenant: true,
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
  }

  async findById(id: string): Promise<Bid | null> {
    return this.prisma.bid.findUnique({
      where: { id },
      include: {
        tenant: true,
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
  }

  async findByAuctionItem(auctionItemId: string): Promise<Bid[]> {
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
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        offered_price: 'desc',
      },
    });
  }

  async findByUser(userId: string): Promise<Bid[]> {
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
        bid_time: 'desc',
      },
    });
  }

  async findByTenant(tenantId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: {
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
            item: true,
            auction: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
    });
  }

  async findHighestBidForAuctionItem(
    auctionItemId: string
  ): Promise<Bid | null> {
    return this.prisma.bid.findFirst({
      where: {
        auctionItemId,
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
      },
      orderBy: {
        offered_price: 'desc',
      },
    });
  }

  async update(id: string, data: Prisma.BidUpdateInput): Promise<Bid> {
    return this.prisma.bid.update({
      where: { id },
      data,
      include: {
        tenant: true,
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
  }

  async softDelete(id: string): Promise<Bid> {
    return this.prisma.bid.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async count(tenantId?: string): Promise<number> {
    const where: Prisma.BidWhereInput = {
      isDeleted: false,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.bid.count({ where });
  }

  // Transaction method for placing bids with validation
  async placeBidWithValidation(data: {
    userId: string;
    auctionId: string;
    auctionItemId: string;
    tenantId: string;
    offered_price: number;
  }): Promise<Bid> {
    return this.prisma.executeTransaction(async (prisma) => {
      // Check current highest bid
      const highestBid = await prisma.bid.findFirst({
        where: {
          auctionItemId: data.auctionItemId,
          isDeleted: false,
        },
        orderBy: {
          offered_price: 'desc',
        },
      });

      // Validate bid amount
      if (
        highestBid &&
        data.offered_price <= Number(highestBid.offered_price)
      ) {
        throw new Error('Bid amount must be higher than current highest bid');
      }

      // Create the bid
      return prisma.bid.create({
        data: {
          userId: data.userId,
          auctionId: data.auctionId,
          auctionItemId: data.auctionItemId,
          tenantId: data.tenantId,
          offered_price: data.offered_price,
          bid_time: new Date(),
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
              item: true,
              auction: true,
            },
          },
        },
      });
    });
  }
}
