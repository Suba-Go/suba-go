import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';

@Injectable()
export class AuctionItemPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuctionWithTenant(auctionId: string) {
    return this.prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        tenantId: true,
      },
    });
  }

  async getAuctionItemsByAuctionId(auctionId: string) {
    return this.prisma.auctionItem.findMany({
      where: {
        auctionId,
        isDeleted: false,
      },
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
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getAuctionItemById(id: string) {
    return this.prisma.auctionItem.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
  }
}
