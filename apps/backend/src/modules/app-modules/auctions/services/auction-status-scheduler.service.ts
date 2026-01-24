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
import { AuctionStatusEnum } from '@prisma/client';

interface SchedulerConfig {
  /** Max wait between checks when there are no imminent events. */
  defaultInterval: number;
  /** Minimum wait between checks to avoid tight loops. */
  minInterval: number;
}

@Injectable()
export class AuctionStatusSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuctionStatusSchedulerService.name);
  private schedulerInterval?: NodeJS.Timeout;
  private isRunning = false;

  private readonly config: SchedulerConfig = {
    // In production, we still want a safety net even if there are no upcoming events.
    // 30s keeps UI reasonably fresh without stressing the DB.
    defaultInterval: 30_000,
    // Prevents busy looping if the next event is extremely close.
    minInterval: 500,
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
        void this.scheduleNextCheck();
      }, nextInterval);

      this.logger.debug(`Next check in ${nextInterval / 1000}s`);
    } catch (error) {
      this.logger.error('Error in scheduler:', error);
      // Retry with default interval on error
      this.schedulerInterval = setTimeout(() => {
        void this.scheduleNextCheck();
      }, this.config.defaultInterval);
    }
  }

  /**
   * Calculate the next interval based on upcoming auction events
   * Returns shorter interval if auctions are about to start/end
   */
  private async calculateNextInterval(): Promise<number> {
    const now = new Date();

    // Find the next known "event" (an auction start or end) and schedule the next wake-up close to it.
    // This avoids a common bug where a long default interval causes auctions to remain "PENDIENTE"
    // for minutes after their startTime (user sees "iniciando" and gets stuck).

    const nextStart = await this.prisma.auction.findFirst({
      where: {
        isDeleted: false,
        status: AuctionStatusEnum.PENDIENTE,
        startTime: { gt: now },
      },
      orderBy: { startTime: 'asc' },
      select: { startTime: true },
    });

    const nextEnd = await this.prisma.auction.findFirst({
      where: {
        isDeleted: false,
        status: AuctionStatusEnum.ACTIVA,
        endTime: { gt: now },
      },
      orderBy: { endTime: 'asc' },
      select: { endTime: true },
    });

    const nextStartMs = nextStart?.startTime?.getTime();
    const nextEndMs = nextEnd?.endTime?.getTime();

    const nextEventMs =
      typeof nextStartMs === 'number' && typeof nextEndMs === 'number'
        ? Math.min(nextStartMs, nextEndMs)
        : typeof nextStartMs === 'number'
          ? nextStartMs
          : typeof nextEndMs === 'number'
            ? nextEndMs
            : null;

    if (!nextEventMs) return this.config.defaultInterval;

    const deltaMs = nextEventMs - now.getTime();
    if (deltaMs <= 0) return this.config.minInterval;

    // Prefer to wake up exactly at the next event when it's reasonably close.
    // This is what prevents the UI from getting stuck on "Iniciando..." after startTime.
    // We still keep a periodic defaultInterval as a safety net to detect newly-created auctions.
    const eventWindowMs = 5 * 60 * 1000; // 5 minutes

    if (deltaMs <= eventWindowMs) {
      return Math.max(this.config.minInterval, deltaMs);
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

// Ensure per-item clocks are initialized (independent timers).
// This keeps the API/UI consistent and allows soft-close to extend only one item.
await this.prisma.auctionItem.updateMany({
  where: {
    auctionId: auction.id,
    OR: [{ startTime: null }, { endTime: null }],
  },
  data: {
    startTime: updatedAuction.startTime,
    endTime: updatedAuction.endTime,
  },
});


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
      // Determine the real auction end based on per-item clocks (soft-close extensions).
      // We treat auction.endTime as the authoritative "overall" end, but keep it in sync with item endTimes.
      const maxItemEndRow = await this.prisma.client.$queryRaw<
        Array<{ max_end: Date | null }>
      >`
        SELECT MAX(COALESCE(ai."endTime", a."endTime")) AS max_end
        FROM "public"."auction_item" ai
        JOIN "public"."auction" a ON a."id" = ai."auctionId"
        WHERE ai."auctionId" = ${auction.id}
      `;
      const maxItemEnd = maxItemEndRow?.[0]?.max_end || auction.endTime;

      // If any item was extended beyond the auction.endTime, keep auction.endTime synced and skip completion.
      if (maxItemEnd && maxItemEnd.getTime() > auction.endTime.getTime()) {
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: { endTime: maxItemEnd },
        });
        this.logger.warn(
          `⏳ Auction ${auction.id} has item endTime beyond auction.endTime. Synced endTime and postponing completion.`
        );
      }

      // If any item still has time remaining, do not complete the auction yet.
      if (maxItemEnd && maxItemEnd.getTime() > now.getTime()) {
        continue;
      }

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
        // No bids - release item back to DISPONIBLE
        await this.prisma.item.update({
          where: { id: auctionItem.itemId },
          data: { state: 'DISPONIBLE' },
        });

        this.logger.log(
          `📦 Item ${
            auctionItem.item.plate || auctionItem.itemId
          } had no bids - released to DISPONIBLE`
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
