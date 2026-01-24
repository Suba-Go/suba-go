import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';

/**
 * Best practice: strongly-type Prisma queries that use `select` / `include`.
 * This prevents future TS errors when accessing relation fields.
 */
const auctionWithTenantArgs = Prisma.validator<Prisma.AuctionDefaultArgs>()({
  select: {
    id: true,
    tenantId: true,
  },
});

export type AuctionWithTenant = Prisma.AuctionGetPayload<
  typeof auctionWithTenantArgs
>;

const auctionItemWithDetailsArgs =
  Prisma.validator<Prisma.AuctionItemDefaultArgs>()({
    include: {
      item: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          year: true,
          version: true,
          photos: true,
          docs: true,
          kilometraje: true,
          legal_status: true,
          state: true,
          basePrice: true,
          description: true,
          soldPrice: true,
          soldAt: true,
          soldToUserId: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          isDeleted: true,
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
        where: {
          isDeleted: false,
        },
        orderBy: {
          offered_price: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              public_name: true,
              role: true,
            },
          },
        },
      },
    },
  });

export type AuctionItemWithDetails = Prisma.AuctionItemGetPayload<
  typeof auctionItemWithDetailsArgs
>;

@Injectable()
export class AuctionItemPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuctionWithTenant(
    auctionId: string,
  ): Promise<AuctionWithTenant | null> {
    return this.prisma.auction.findUnique({
      where: { id: auctionId },
      ...auctionWithTenantArgs,
    });
  }

  async getAuctionItemsByAuctionId(
    auctionId: string,
  ): Promise<AuctionItemWithDetails[]> {
    return this.prisma.auctionItem.findMany({
      where: {
        auctionId,
        isDeleted: false,
      },
      ...auctionItemWithDetailsArgs,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getAuctionItemById(id: string) {
    return this.prisma.auctionItem.findUnique({
      // NOTE: Prisma `findUnique` only supports unique filters.
      // This cast keeps existing behavior without changing runtime.
      where: {
        id,
        isDeleted: false,
      } as any,
    });
  }
}
