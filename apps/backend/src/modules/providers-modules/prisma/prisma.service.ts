import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private prismaWithAccelerate: ReturnType<typeof this.createAcceleratedClient>;

  constructor() {
    // Use PRISMA_DATABASE_URL for Accelerate, fallback to DATABASE_URL for standard connection
    const databaseUrl =
      process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

    this.prisma = new PrismaClient({
      datasourceUrl: databaseUrl,
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });

    // Only create accelerated client if using Prisma Accelerate URL
    if (process.env.PRISMA_DATABASE_URL?.startsWith('prisma')) {
      this.prismaWithAccelerate = this.createAcceleratedClient();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prismaWithAccelerate = this.prisma as any;
    }
  }

  private createAcceleratedClient() {
    return this.prisma.$extends(withAccelerate());
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Getter for the accelerated client (recommended for production)
  get accelerated() {
    return this.prismaWithAccelerate;
  }

  // Getter for the standard client
  get client() {
    return this.prisma;
  }

  // Expose Prisma client methods
  get user() {
    return this.prisma.user;
  }

  get tenant() {
    return this.prisma.tenant;
  }

  get company() {
    return this.prisma.company;
  }

  get item() {
    return this.prisma.item;
  }

  get auction() {
    return this.prisma.auction;
  }

  get auctionItem() {
    return this.prisma.auctionItem;
  }

  get bid() {
    return this.prisma.bid;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Prisma health check failed:', error);
      return false;
    }
  }

  // Transaction helper
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fn(prisma as any);
    });
  }
}
