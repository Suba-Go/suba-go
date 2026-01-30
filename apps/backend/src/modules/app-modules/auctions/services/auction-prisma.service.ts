import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { Prisma, ItemStateEnum } from '@prisma/client';
import type {
  Auction as AuctionModel,
  Bid as BidModel,
  AuctionTypeEnum,
  AuctionStatusEnum,
  Auction,
} from '@prisma/client';

/**
 * Best practice: strongly-type Prisma queries that use `include` / `select`.
 * Returning a plain `Auction`/`Bid` type while using `include` leads to future TS errors
 * (e.g. "Property 'items' does not exist on type 'Auction'").
 */
const auctionWithDetailsArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
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
	            // Needed for AUCTION_MANAGER views (real bidder name).
	            // USER views will be sanitized in AuctionsService.getAuctionById.
	            name: true,
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

export type AuctionWithDetails = Prisma.AuctionGetPayload<
  typeof auctionWithDetailsArgs
>;

const activeAuctionsArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
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
});

export type ActiveAuctionWithItems = Prisma.AuctionGetPayload<
  typeof activeAuctionsArgs
>;

const bidWithUserArgs = Prisma.validator<Prisma.BidDefaultArgs>()({
  include: {
    user: {
      select: {
        id: true,
        email: true,
      },
    },
  },
});

export type BidWithUser = Prisma.BidGetPayload<typeof bidWithUserArgs>;

const bidWithAuctionItemArgs = Prisma.validator<Prisma.BidDefaultArgs>()({
  include: {
    auctionItem: {
      include: {
        item: true,
        auction: true,
      },
    },
  },
});

export type BidWithAuctionItem = Prisma.BidGetPayload<
  typeof bidWithAuctionItemArgs
>;

const placedBidArgs = Prisma.validator<Prisma.BidDefaultArgs>()({
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

export type PlacedBid = Prisma.BidGetPayload<typeof placedBidArgs>;

const auctionsByTenantArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
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
          orderBy: {
            offered_price: 'desc',
          },
        },
      },
    },
  },
});

export type AuctionsByTenant = Prisma.AuctionGetPayload<
  typeof auctionsByTenantArgs
>;

const auctionStatusUpdateArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
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

export type AuctionWithStatusUpdate = Prisma.AuctionGetPayload<
  typeof auctionStatusUpdateArgs
>;

const closeAuctionFetchArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
  include: {
    items: {
      include: {
        item: true,
        bids: {
          where: { isDeleted: false },
          orderBy: { offered_price: 'desc' },
          take: 1,
        },
      },
    },
  },
});

type CloseAuctionFetch = Prisma.AuctionGetPayload<typeof closeAuctionFetchArgs>;

const closeAuctionResultArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
  include: {
    items: {
      include: {
        item: true,
        bids: {
          orderBy: { offered_price: 'desc' },
          take: 1,
          include: { user: true },
        },
      },
    },
  },
});

export type CloseAuctionResult = Prisma.AuctionGetPayload<
  typeof closeAuctionResultArgs
>;

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
    itemIds?: string[];
  }): Promise<AuctionModel> {
    return this.prisma.auction.create({
      data,
    });
  }

  // Get auction with all related data
  async getAuctionById(id: string): Promise<AuctionWithDetails | null> {
    return this.prisma.auction.findUnique({
      where: { id },
      ...auctionWithDetailsArgs,
    });
  }

  // Get active auctions for a tenant
  async getActiveAuctions(tenantId: string): Promise<ActiveAuctionWithItems[]> {
    const now = new Date();

    return this.prisma.auction.findMany({
      where: {
        tenantId,
        startTime: { lte: now },
        endTime: { gte: now },
        status: 'ACTIVA',
        isDeleted: false,
      },
      ...activeAuctionsArgs,
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
  }): Promise<PlacedBid> {
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
          requestId: randomUUID(),
          userId: data.userId,
          auctionId: data.auctionId,
          auctionItemId: data.auctionItemId,
          offered_price: data.amount,
          tenantId: data.tenantId,
          bid_time: new Date(),
        },
        ...placedBidArgs,
      });
    });
  }

  // Get bid history for an auction item
  async getBidHistory(auctionItemId: string): Promise<BidWithUser[]> {
    return this.prisma.bid.findMany({
      where: {
        auctionItemId,
        isDeleted: false,
      },
      ...bidWithUserArgs,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get user's bids
  async getUserBids(userId: string): Promise<BidWithAuctionItem[]> {
    return this.prisma.bid.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      ...bidWithAuctionItemArgs,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get auctions by tenant
  async getAuctionsByTenant(tenantId: string): Promise<AuctionsByTenant[]> {
    return this.prisma.auction.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        registeredUsers: {
          select: {
            userId: true,
          },
        },
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

  // Get active auctions where user is registered
  async getUserActiveRegisteredAuctions(
    userId: string,
    tenantId: string
  ): Promise<Auction[]> {
    const now = new Date();

    return this.prisma.auction.findMany({
      where: {
        tenantId,
        // Active or pending/about to start
        OR: [
          { status: 'ACTIVA' },
          { status: 'PENDIENTE', startTime: { lte: now } },
        ],
        endTime: { gte: now },
        isDeleted: false,
        // Only auctions where the user is registered
        registeredUsers: {
          some: {
            userId: userId,
          },
        },
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
            },
          },
        },
      },
      orderBy: {
        endTime: 'asc',
      },
    });
  }

  // Get user auction registrations
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
  ): Promise<AuctionModel> {
    return this.prisma.auction.update({
      where: { id },
      data,
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
  ): Promise<AuctionWithStatusUpdate> {
    return this.prisma.auction.update({
      where: { id },
      data: { status },
      ...auctionStatusUpdateArgs,
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

  async addItemsToAuction(auctionId: string, itemIds: string[]): Promise<void> {
    await this.prisma.executeTransaction(async (prisma) => {
      // Reserve items first (atomic) so they can't be selected by other pending auctions
      const notAvailable = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
          isDeleted: false,
          state: { not: ItemStateEnum.DISPONIBLE },
        },
        select: { id: true, state: true },
      });

      if (notAvailable.length > 0) {
        const details = notAvailable.map((i) => `${i.id}(${i.state})`).join(', ');
        throw new Error(`Algunos items no están disponibles para agregar a la subasta: ${details}`);
      }

      await prisma.item.updateMany({
        where: {
          id: { in: itemIds },
          isDeleted: false,
          state: ItemStateEnum.DISPONIBLE,
        },
        data: {
          state: ItemStateEnum.EN_SUBASTA,
        },
      });

      // Create AuctionItem records for each selected item
      const items = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
        },
        select: { id: true, basePrice: true },
      });

      const auctionItems = items.map((item) => ({
        auctionId,
        itemId: item.id,
        startingBid: item.basePrice,
      }));

      await prisma.auctionItem.createMany({
        data: auctionItems,
        skipDuplicates: true,
      });
    });
  }

  /**
   * Reserve items that are already linked to an auction via AuctionItem rows.
   * Used when an auction is uncancelled (relations already exist).
   */
  async reserveItemsFromAuction(auctionId: string): Promise<void> {
    await this.prisma.executeTransaction(async (prisma) => {
      const auctionItems = await prisma.auctionItem.findMany({
        where: { auctionId, isDeleted: false },
        select: { itemId: true },
      });

      const itemIds = Array.from(new Set(auctionItems.map((ai) => ai.itemId)));
      if (itemIds.length === 0) return;

      const notAvailable = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
          isDeleted: false,
          state: { not: ItemStateEnum.DISPONIBLE },
        },
        select: { id: true, state: true },
      });

      if (notAvailable.length > 0) {
        const details = notAvailable.map((i) => `${i.id}(${i.state})`).join(', ');
        throw new Error(`No se pueden reservar items porque ya están en otra subasta: ${details}`);
      }

      await prisma.item.updateMany({
        where: {
          id: { in: itemIds },
          isDeleted: false,
          state: ItemStateEnum.DISPONIBLE,
        },
        data: { state: ItemStateEnum.EN_SUBASTA },
      });
    });
  }

  /**
   * Releases items reserved for an auction back to DISPONIBLE (only if still EN_SUBASTA).
   * Does NOT delete auction-item relations; sold items remain untouched.
   */
  async releaseItemsFromAuction(auctionId: string): Promise<void> {
    const auctionItems = await this.prisma.auctionItem.findMany({
      where: { auctionId, isDeleted: false },
      select: { itemId: true },
    });

    const itemIds = Array.from(new Set(auctionItems.map((ai) => ai.itemId)));
    if (itemIds.length === 0) return;

    await this.prisma.item.updateMany({
      where: {
        id: { in: itemIds },
        state: ItemStateEnum.EN_SUBASTA,
        isDeleted: false,
      },
      data: {
        state: ItemStateEnum.DISPONIBLE,
      },
    });
  }

  async removeAllItemsFromAuction(auctionId: string): Promise<void> {
    await this.prisma.executeTransaction(async (prisma) => {
      // First release reserved items back to DISPONIBLE (only those still EN_SUBASTA)
      const auctionItems = await prisma.auctionItem.findMany({
        where: { auctionId, isDeleted: false },
        select: { itemId: true },
      });

      const itemIds = Array.from(new Set(auctionItems.map((ai) => ai.itemId)));
      if (itemIds.length > 0) {
        await prisma.item.updateMany({
          where: {
            id: { in: itemIds },
            state: ItemStateEnum.EN_SUBASTA,
            isDeleted: false,
          },
          data: { state: ItemStateEnum.DISPONIBLE },
        });
      }

      await prisma.auctionItem.deleteMany({
        where: { auctionId },
      });
    });
  }


async removeItemsFromAuction(
    auctionId: string,
    itemIds: string[]
  ): Promise<void> {
    const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    await this.prisma.executeTransaction(async (prisma) => {
      // Only operate on items that are actually linked to this auction
      const linked = await prisma.auctionItem.findMany({
        where: {
          auctionId,
          itemId: { in: uniqueIds },
          isDeleted: false,
        },
        select: { itemId: true },
      });

      const linkedIds = Array.from(new Set(linked.map((ai) => ai.itemId)));
      if (linkedIds.length === 0) return;

      // Release reserved items back to DISPONIBLE (only those still EN_SUBASTA)
      await prisma.item.updateMany({
        where: {
          id: { in: linkedIds },
          state: ItemStateEnum.EN_SUBASTA,
          isDeleted: false,
        },
        data: { state: ItemStateEnum.DISPONIBLE },
      });

      // Remove the auction-item relations
      await prisma.auctionItem.deleteMany({
        where: {
          auctionId,
          itemId: { in: linkedIds },
        },
      });
    });
  }


  // Close auction and determine winners
  async closeAuction(auctionId: string): Promise<CloseAuctionResult> {
    return this.prisma.executeTransaction(async (prisma) => {
      // Get auction with items and their highest bids
      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        ...closeAuctionFetchArgs,
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      // Update each item with winning bid price
      for (const auctionItem of auction.items) {
        const winningBid = auctionItem.bids[0];

        if (winningBid && auctionItem.item) {
          await prisma.item.update({
            where: { id: auctionItem.item.id },
            data: {
              soldPrice: winningBid.offered_price,
              soldAt: new Date(),
              soldToUserId: winningBid.userId,
              state: 'VENDIDO',
            },
          });
        } else if (auctionItem.item) {
          // No bids -> item is NOT sold, release it back to DISPONIBLE
          await prisma.item.update({
            where: { id: auctionItem.item.id },
            data: {
              state: ItemStateEnum.DISPONIBLE,
            },
          });
        }
      }


      // Update auction status to COMPLETADA
      const updatedAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'COMPLETADA' },
        ...closeAuctionResultArgs,
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
