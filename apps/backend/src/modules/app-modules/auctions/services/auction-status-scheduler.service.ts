/**
 * @file auction-status-scheduler.service.ts
 * @description Smart scheduler for automatic auction status updates
 * Uses adaptive polling - checks more frequently when auctions are about to start/end
 * @author Suba&Go
 */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { AuctionsGateway } from '../../../providers-modules/realtime/auctions.gateway';
import { AuctionStatusEnum } from '@suba-go/shared-validation';

interface SchedulerConfig {
  defaultInterval: number; // 30 seconds
  urgentInterval: number; // 5 seconds
  urgentThreshold: number; // 1 minutes - check more frequently if auction starts/ends within this time
}

@Injectable()
export class AuctionStatusSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuctionStatusSchedulerService.name);
  private schedulerInterval?: NodeJS.Timeout;
  private isRunning = false;

  private readonly config: SchedulerConfig = {
    defaultInterval: 30000, // 30 seconds
    urgentInterval: 5000, // 5 seconds
    urgentThreshold: 60000, // 1 minutes
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsGateway: AuctionsGateway
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Auction Status Scheduler initialized');
    this.startScheduler();
  }

  onModuleDestroy() {
    this.stopScheduler();
    this.logger.log('🛑 Auction Status Scheduler stopped');
  }

  /**
   * Start the scheduler with adaptive polling
   */
  private startScheduler() {
    if (this.isRunning) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    this.scheduleNextCheck();
    this.logger.log('✅ Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  private stopScheduler() {
    if (this.schedulerInterval) {
      clearTimeout(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    this.isRunning = false;
  }

  /**
   * Schedule the next check with adaptive interval
   */
  private async scheduleNextCheck() {
    if (!this.isRunning) return;

    try {
      // Check for status updates
      await this.checkAndUpdateAuctionStatuses();

      // Determine next interval based on urgency
      const nextInterval = await this.calculateNextInterval();

      // Schedule next check
      this.schedulerInterval = setTimeout(() => {
        this.scheduleNextCheck();
      }, nextInterval);

      this.logger.debug(`Next check in ${nextInterval / 1000}s`);
    } catch (error) {
      this.logger.error('Error in scheduler:', error);
      // Retry with default interval on error
      this.schedulerInterval = setTimeout(() => {
        this.scheduleNextCheck();
      }, this.config.defaultInterval);
    }
  }

  /**
   * Calculate the next interval based on upcoming auction events
   * Returns shorter interval if auctions are about to start/end
   */
  private async calculateNextInterval(): Promise<number> {
    const now = new Date();
    const urgentThresholdTime = new Date(
      now.getTime() + this.config.urgentThreshold
    );

    // Check if any auctions are starting or ending soon
    const urgentAuctions = await this.prisma.auction.count({
      where: {
        isDeleted: false,
        OR: [
          // Auctions starting soon
          {
            status: AuctionStatusEnum.PENDIENTE,
            startTime: {
              gte: now,
              lte: urgentThresholdTime,
            },
          },
          // Auctions ending soon
          {
            status: AuctionStatusEnum.ACTIVA,
            endTime: {
              gte: now,
              lte: urgentThresholdTime,
            },
          },
        ],
      },
    });

    if (urgentAuctions > 0) {
      this.logger.debug(
        `⚡ ${urgentAuctions} urgent auction(s) - using fast polling`
      );
      return this.config.urgentInterval;
    }

    return this.config.defaultInterval;
  }

  /**
   * Check and update auction statuses based on current time
   */
  private async checkAndUpdateAuctionStatuses() {
    const now = new Date();

    // 1. Start PENDIENTE auctions that have reached their startTime
    await this.startPendingAuctions(now);

    // 2. Complete ACTIVA auctions that have passed their endTime
    await this.completeActiveAuctions(now);
  }

  /**
   * Start auctions that are PENDIENTE and have reached their startTime
   */
  private async startPendingAuctions(now: Date) {
    const auctionsToStart = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatusEnum.PENDIENTE,
        startTime: { lte: now },
        isDeleted: false,
      },
      include: {
        tenant: true,
      },
    });

    for (const auction of auctionsToStart) {
      try {
        // Update status to ACTIVA
        const updatedAuction = await this.prisma.auction.update({
          where: { id: auction.id },
          data: { status: AuctionStatusEnum.ACTIVA },
          include: {
            tenant: true,
            items: {
              include: {
                item: true,
              },
            },
          },
        });

        this.logger.log(`✅ Started auction: ${auction.title} (${auction.id})`);

        // Broadcast status change via WebSocket
        this.auctionsGateway.broadcastAuctionStatusChange(
          auction.tenantId,
          auction.id,
          AuctionStatusEnum.ACTIVA,
          updatedAuction
        );
      } catch (error) {
        this.logger.error(`Failed to start auction ${auction.id}:`, error);
      }
    }

    if (auctionsToStart.length > 0) {
      this.logger.log(`🚀 Started ${auctionsToStart.length} auction(s)`);
    }
  }

  /**
   * Complete auctions that are ACTIVA and have passed their endTime
   */
  private async completeActiveAuctions(now: Date) {
    const auctionsToComplete = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatusEnum.ACTIVA,
        endTime: { lte: now },
        isDeleted: false,
      },
      include: {
        tenant: true,
      },
    });

    for (const auction of auctionsToComplete) {
      try {
        // Process each auction item to determine winners and update item status
        await this.processAuctionItemsOnCompletion(
          auction.id,
          auction.tenantId
        );

        // Update status to COMPLETADA
        const updatedAuction = await this.prisma.auction.update({
          where: { id: auction.id },
          data: { status: AuctionStatusEnum.COMPLETADA },
          include: {
            tenant: true,
            items: {
              include: {
                item: true,
              },
            },
          },
        });

        this.logger.log(
          `🏁 Completed auction: ${auction.title} (${auction.id})`
        );

        // Broadcast status change via WebSocket
        this.auctionsGateway.broadcastAuctionStatusChange(
          auction.tenantId,
          auction.id,
          AuctionStatusEnum.COMPLETADA,
          updatedAuction
        );
      } catch (error) {
        this.logger.error(`Failed to complete auction ${auction.id}:`, error);
      }
    }

    if (auctionsToComplete.length > 0) {
      this.logger.log(`🏁 Completed ${auctionsToComplete.length} auction(s)`);
    }
  }

  /**
   * Process auction items when auction completes
   * - Find highest bid for each item
   * - Mark item as VENDIDO if there was a bid
   * - Update item with sold price and buyer
   * - Create audit log entry
   */
  private async processAuctionItemsOnCompletion(
    auctionId: string,
    tenantId: string
  ) {
    // Get all auction items with their bids
    const auctionItems = await this.prisma.auctionItem.findMany({
      where: { auctionId },
      include: {
        item: true,
        bids: {
          orderBy: { offered_price: 'desc' },
          take: 1,
          include: { user: true },
        },
      },
    });

    for (const auctionItem of auctionItems) {
      const highestBid = auctionItem.bids[0];

      if (highestBid) {
        // Item was sold - update item status
        await this.prisma.item.update({
          where: { id: auctionItem.itemId },
          data: {
            state: 'VENDIDO',
            soldPrice: highestBid.offered_price,
            soldAt: new Date(),
            soldToUserId: highestBid.userId,
          },
        });

        this.logger.log(
          `💰 Item ${auctionItem.item.plate || auctionItem.itemId} sold to ${
            highestBid.user.email
          } for $${Number(highestBid.offered_price).toLocaleString()}`
        );

        // Create audit log entry
        await this.prisma.auditLog.create({
          data: {
            action: 'ITEM_SOLD',
            entityType: 'Item',
            entityId: auctionItem.itemId,
            userId: highestBid.userId,
            tenantId,
            changes: {
              auctionId,
              auctionItemId: auctionItem.id,
              bidId: highestBid.id,
              soldPrice: Number(highestBid.offered_price),
              soldTo: {
                userId: highestBid.userId,
                email: highestBid.user.email,
                name: highestBid.user.public_name || highestBid.user.name,
              },
              item: {
                id: auctionItem.item.id,
                plate: auctionItem.item.plate,
                brand: auctionItem.item.brand,
                model: auctionItem.item.model,
              },
            },
          },
        });
      } else {
        // No bids - item remains in its current state
        this.logger.log(
          `📦 Item ${
            auctionItem.item.plate || auctionItem.itemId
          } had no bids - remains ${auctionItem.item.state}`
        );
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}
