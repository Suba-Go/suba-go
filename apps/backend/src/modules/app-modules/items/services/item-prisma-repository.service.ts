import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { Item, Prisma, ItemStateEnum } from '@prisma/client';

@Injectable()
export class ItemPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ItemCreateInput): Promise<Item> {
    return this.prisma.item.create({
      data,
      include: {
        tenant: true,
        auctionItems: true,
      },
    });
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        tenant: true,
        auctionItems: {
          include: {
            auction: true,
            bids: true,
          },
        },
      },
    });
  }

  async findByTenant(tenantId: string): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        auctionItems: true,
      },
    });
  }

  async findByState(state: string, tenantId?: string): Promise<Item[]> {
    const where: Prisma.ItemWhereInput = {
      state: state as ItemStateEnum,
      isDeleted: false,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.item.findMany({
      where,
      include: {
        tenant: true,
        auctionItems: true,
      },
    });
  }

  async findByPlate(plate: string): Promise<Item | null> {
    return this.prisma.item.findFirst({
      where: {
        plate,
        isDeleted: false,
      },
      include: {
        tenant: true,
        auctionItems: true,
      },
    });
  }

  async update(id: string, data: Prisma.ItemUpdateInput): Promise<Item> {
    return this.prisma.item.update({
      where: { id },
      data,
      include: {
        tenant: true,
        auctionItems: true,
      },
    });
  }

  async softDelete(id: string): Promise<Item> {
    return this.prisma.item.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async count(tenantId?: string): Promise<number> {
    const where: Prisma.ItemWhereInput = {
      isDeleted: false,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.item.count({ where });
  }

  async findAvailableItems(tenantId: string): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: {
        tenantId,
        state: ItemStateEnum.DISPONIBLE,
        isDeleted: false,
      },
      include: {
        tenant: true,
      },
    });
  }

  async findSoldToUser(userId: string, tenantId: string): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: {
        tenantId,
        soldToUserId: userId,
        state: ItemStateEnum.VENDIDO,
        isDeleted: false,
      },
      include: {
        tenant: true,
        soldToUser: {
          select: {
            id: true,
            email: true,
            public_name: true,
            role: true,
          },
        },
        auctionItems: {
          include: {
            auction: {
              select: {
                id: true,
                title: true,
                status: true,
                endTime: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the most recent auction
        },
      },
      orderBy: {
        soldAt: 'desc',
      },
    });
  }
}
