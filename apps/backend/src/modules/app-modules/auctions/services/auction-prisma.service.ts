import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type {
  Auction,
  Bid,
  AuctionTypeEnum,
  AuctionStatusEnum,
} from '@prisma/client';

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
    type?: AuctionTypeEnum;
    bidIncrement?: number;
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
            item: {
              include: {
                soldToUser: {
                  select: {
                    id: true,
                    email: true,
                    public_name: true,
                    name: true,
                    // Don't include password
                  },
                },
              },
            },
            bids: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    public_name: true,
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
        status: 'ACTIVA',
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
    tenantId: string;
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
          offered_price: 'desc',
        },
      });

      // Validate bid amount
      if (highestBid && data.amount <= Number(highestBid.offered_price)) {
        throw new Error('Bid amount must be higher than current highest bid');
      }

      // Create the bid
      return prisma.bid.create({
        data: {
          userId: data.userId,
          auctionId: data.auctionId,
          auctionItemId: data.auctionItemId,
          offered_price: data.amount,
          tenantId: data.tenantId,
          bid_time: new Date(),
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

  // Get auctions by tenant
  async getAuctionsByTenant(tenantId: string): Promise<Auction[]> {
    return this.prisma.auction.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                soldToUser: {
                  select: {
                    id: true,
                    email: true,
                    public_name: true,
                    name: true,
                  },
                },
              },
            },
            bids: {
              take: 1,
              orderBy: {
                offered_price: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get user's auction registrations
  async getUserAuctionRegistrations(userId: string): Promise<any[]> {
    return this.prisma.auctionRegistration.findMany({
      where: {
        userId,
      },
      include: {
        auction: {
          include: {
            items: {
              include: {
                item: true,
                bids: {
                  take: 1,
                  orderBy: {
                    offered_price: 'desc',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update auction
  async updateAuction(
    id: string,
    data: {
      title?: string;
      description?: string;
      startTime?: Date;
      endTime?: Date;
      type?: AuctionTypeEnum;
      bidIncrement?: number;
    }
  ): Promise<Auction> {
    return this.prisma.auction.update({
      where: { id },
      data,
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

  // Delete auction (soft delete)
  async deleteAuction(id: string): Promise<void> {
    await this.prisma.auction.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Update auction status
  async updateAuctionStatus(
    id: string,
    status: AuctionStatusEnum
  ): Promise<Auction> {
    return this.prisma.auction.update({
      where: { id },
      data: { status },
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

  // Get auction statistics
  async getAuctionStats(tenantId: string): Promise<{
    totalAuctions: number;
    activeAuctions: number;
    totalParticipants: number;
    totalRevenue: number;
  }> {
    const [totalAuctions, activeAuctions, participantsResult, revenueResult] =
      await Promise.all([
        // Total auctions where are real
        this.prisma.auction.count({
          where: {
            tenantId,
            isDeleted: false,
          },
        }),

        // Active auctions where are real
        this.prisma.auction.count({
          where: {
            tenantId,
            status: 'ACTIVA',
            isDeleted: false,
          },
        }),

        // Total unique participants
        this.prisma.bid.findMany({
          where: {
            auctionItem: {
              auction: {
                tenantId,
                isDeleted: false,
              },
            },
            isDeleted: false,
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        }),

        // Total revenue (sum of soldPrice from sold items in completed REAL auctions)
        this.prisma.item.aggregate({
          where: {
            isDeleted: false,
            state: 'VENDIDO',
            soldPrice: {
              not: null,
            },
            auctionItems: {
              some: {
                auction: {
                  tenantId,
                  status: 'COMPLETADA',
                  isDeleted: false,
                  type: 'REAL',
                },
              },
            },
          },
          _sum: {
            soldPrice: true,
          },
        }),
      ]);

    return {
      totalAuctions,
      activeAuctions,
      totalParticipants: participantsResult.length,
      totalRevenue: Number(revenueResult._sum.soldPrice) || 0,
    };
  }

  // Add items to auction
  async addItemsToAuction(auctionId: string, itemIds: string[]): Promise<void> {
    // Create AuctionItem records for each selected item
    const items = await this.prisma.item.findMany({
      where: {
        id: {
          in: itemIds,
        },
      },
    });
    const auctionItems = items.map((item) => ({
      auctionId,
      itemId: item.id,
      startingBid: item.basePrice,
    }));

    await this.prisma.auctionItem.createMany({
      data: auctionItems,
    });
  }

  // Remove all items from auction
  async removeAllItemsFromAuction(auctionId: string): Promise<void> {
    await this.prisma.auctionItem.deleteMany({
      where: { auctionId },
    });
  }

  // Close auction and determine winners
  async closeAuction(auctionId: string): Promise<Auction> {
    return this.prisma.executeTransaction(async (prisma) => {
      // Get auction with items and their highest bids
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          items: {
            include: {
              item: true,
              bids: {
                where: { isDeleted: false },
                orderBy: {
                  offered_price: 'desc',
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // Update each item with winning bid price
      for (const auctionItem of auction.items) {
        const winningBid = auctionItem.bids[0];

        if (winningBid && auctionItem.item) {
          // Update item with soldPrice and mark as VENDIDO
          await prisma.item.update({
            where: { id: auctionItem.item.id },
            data: {
              soldPrice: winningBid.offered_price,
              soldAt: new Date(),
              soldToUserId: winningBid.userId,
              state: 'VENDIDO',
            },
          });
        }
      }

      // Update auction status to COMPLETADA
      const updatedAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'COMPLETADA' },
        include: {
          items: {
            include: {
              item: true,
              bids: {
                orderBy: {
                  offered_price: 'desc',
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

      return updatedAuction;
    });
  }

  // Register user to auction
  async registerUserToAuction(
    auctionId: string,
    userId: string
  ): Promise<void> {
    // Use upsert to handle duplicates gracefully
    try {
      await this.prisma.auctionRegistration.create({
        data: {
          auctionId,
          userId,
        },
      });
    } catch (error: any) {
      // If it's a unique constraint error, the user is already registered
      if (error?.code === 'P2002') {
        throw new Error('Usuario ya está registrado en esta subasta');
      }
      throw error;
    }
  }

  // Unregister user from auction
  async unregisterUserFromAuction(
    auctionId: string,
    userId: string
  ): Promise<void> {
    await this.prisma.auctionRegistration.deleteMany({
      where: {
        auctionId,
        userId,
      },
    });
  }

  // Get auction participants
  async getAuctionParticipants(auctionId: string) {
    const registrations = await this.prisma.auctionRegistration.findMany({
      where: { auctionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            public_name: true,
            phone: true,
            rut: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return registrations.map((r) => r.user);
  }
}
