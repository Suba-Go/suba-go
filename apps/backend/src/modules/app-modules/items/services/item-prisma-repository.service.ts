import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { Item, Prisma, ItemStateEnum } from '@prisma/client';

@Injectable()
export class ItemPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns true if the given user has a registration for at least one of the auctions.
   * Used to protect item detail access for USER role.
   */
  async isUserRegisteredForAuctions(
    userId: string,
    auctionIds: string[]
  ): Promise<boolean> {
    if (!userId || auctionIds.length === 0) return false;
    const count = await this.prisma.auctionRegistration.count({
      where: {
        userId,
        auctionId: { in: auctionIds },
      },
    });
    return count > 0;
  }

  async create(data: Prisma.ItemCreateInput): Promise<Item> {
    return this.prisma.item.create({
      data,
      include: {
        tenant: true,
        vehicles: true,
        auctionItems: true,
      },
    });
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        tenant: true,
        vehicles: true,
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
        vehicles: true,
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
        vehicles: true,
        auctionItems: true,
      },
    });
  }

  /**
   * Finds the item (lot) that contains a vehicle with the given plate within a
   * tenant. Plate uniqueness now lives on the vehicle, so we resolve the parent
   * item through the vehicle relation.
   */
  async findByPlate(plate: string, tenantId?: string): Promise<Item | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plate,
        isDeleted: false,
        ...(tenantId ? { tenantId } : {}),
        item: { isDeleted: false },
      },
      include: {
        item: {
          include: {
            tenant: true,
            vehicles: true,
            auctionItems: true,
          },
        },
      },
    });
    return vehicle?.item ?? null;
  }

  async update(id: string, data: Prisma.ItemUpdateInput): Promise<Item> {
    return this.prisma.item.update({
      where: { id },
      data,
      include: {
        tenant: true,
        vehicles: true,
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
    // An item is considered available only if:
    // - It is DISPONIBLE
    // - It is NOT currently linked to an auction that is PENDIENTE or ACTIVA
    //   (This protects against older data where state might not have been updated yet).
    return this.prisma.item.findMany({
      where: {
        tenantId,
        state: ItemStateEnum.DISPONIBLE,
        isDeleted: false,
        auctionItems: {
          none: {
            isDeleted: false,
            auction: {
              isDeleted: false,
              status: {
                in: ['PENDIENTE', 'ACTIVA'],
              },
            },
          },
        },
      },
      include: {
        tenant: true,
        vehicles: true,
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
        vehicles: true,
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
