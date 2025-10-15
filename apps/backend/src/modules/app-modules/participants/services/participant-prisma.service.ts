import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { User, Bid } from '@prisma/client';

@Injectable()
export class ParticipantPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async findParticipantsByAuction(auctionId: string): Promise<User[]> {
    // Find users who have placed bids in this auction
    const bidders = await this.prisma.user.findMany({
      where: {
        bids: {
          some: {
            auctionItem: {
              auctionId,
            },
            isDeleted: false,
          },
        },
        isDeleted: false,
      },
      include: {
        tenant: true,
        bids: {
          where: {
            auctionItem: {
              auctionId,
            },
            isDeleted: false,
          },
          include: {
            auctionItem: true,
          },
        },
      },
      distinct: ['id'],
    });

    return bidders;
  }

  async findParticipantsByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'USER', // Only regular users, not auction managers
        isDeleted: false,
      },
      include: {
        tenant: true,
        bids: {
          where: {
            isDeleted: false,
          },
          include: {
            auctionItem: {
              include: {
                auction: true,
              },
            },
          },
        },
      },
    });
  }

  async findActiveParticipants(tenantId: string): Promise<User[]> {
    // Find users who have placed bids in active auctions
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'USER',
        isDeleted: false,
        bids: {
          some: {
            auctionItem: {
              auction: {
                status: 'ACTIVA',
                isDeleted: false,
              },
            },
            isDeleted: false,
          },
        },
      },
      include: {
        tenant: true,
        bids: {
          where: {
            auctionItem: {
              auction: {
                status: 'ACTIVA',
                isDeleted: false,
              },
            },
            isDeleted: false,
          },
          include: {
            auctionItem: {
              include: {
                auction: true,
              },
            },
          },
        },
      },
      distinct: ['id'],
    });
  }

  async getParticipantStats(tenantId: string): Promise<{
    totalParticipants: number;
    activeParticipants: number;
    totalBids: number;
    averageBidsPerParticipant: number;
  }> {
    const [totalParticipants, activeParticipants, totalBids] =
      await Promise.all([
        // Total participants (users who have placed at least one bid)
        this.prisma.user.count({
          where: {
            tenantId,
            role: 'USER',
            isDeleted: false,
            bids: {
              some: {
                isDeleted: false,
              },
            },
          },
        }),

        // Active participants (users with bids in active auctions)
        this.prisma.user.count({
          where: {
            tenantId,
            role: 'USER',
            isDeleted: false,
            bids: {
              some: {
                auctionItem: {
                  auction: {
                    status: 'ACTIVA',
                    isDeleted: false,
                  },
                },
                isDeleted: false,
              },
            },
          },
        }),

        // Total bids count
        this.prisma.bid.count({
          where: {
            tenantId,
            isDeleted: false,
          },
        }),
      ]);

    const averageBidsPerParticipant =
      totalParticipants > 0 ? totalBids / totalParticipants : 0;

    return {
      totalParticipants,
      activeParticipants,
      totalBids,
      averageBidsPerParticipant:
        Math.round(averageBidsPerParticipant * 100) / 100,
    };
  }

  async findParticipantById(
    id: string,
    tenantId: string
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        bids: {
          where: {
            isDeleted: false,
          },
          include: {
            auctionItem: {
              include: {
                auction: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getParticipantBidHistory(
    userId: string,
    tenantId: string
  ): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: {
        userId,
        tenantId,
        isDeleted: false,
      },
      include: {
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async inviteParticipant(email: string, tenantId: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });

    if (existingUser) {
      if (existingUser.isDeleted) {
        // Reactivate deleted user
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
        });
      }
      return existingUser;
    }

    // Create new user with default values
    return this.prisma.user.create({
      data: {
        email,
        password: 'temp_password', // TODO: Generate proper temporary password
        role: 'USER',
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  async removeParticipant(userId: string, tenantId: string): Promise<void> {
    // Check if user has active bids
    const activeBids = await this.prisma.bid.count({
      where: {
        userId,
        tenantId,
        auctionItem: {
          auction: {
            status: 'ACTIVA',
          },
        },
        isDeleted: false,
      },
    });

    if (activeBids > 0) {
      throw new Error(
        'No se puede eliminar un participante con ofertas activas'
      );
    }

    // Soft delete the user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
