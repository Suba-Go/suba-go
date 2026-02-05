/**
 * @file bid-realtime.service.ts
 * @description Service for handling real-time bid operations with WebSocket integration
 * @author Suba&Go
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BidPrismaService } from './bid-prisma.service';
import { AuctionsGateway } from '../../../providers-modules/realtime/auctions.gateway';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Bid, AuctionItem, Auction, Item, User } from '@prisma/client';
import { BidPlacedData } from '@suba-go/shared-validation';

type BidWithRelations = Bid & {
  user: User;
  auctionItem: AuctionItem & {
    auction: Auction;
    item: Item;
  };
};

type PlaceBidResult = {
  bid: BidWithRelations;
  /** True only when the bid row was inserted in this call (not a duplicate requestId). */
  createdNow: boolean;
  /** Payload to echo back to the bidder (and/or broadcast). */
  bidPlacedData: BidPlacedData;
};

@Injectable()
export class BidRealtimeService {
  private readonly logger = new Logger(BidRealtimeService.name);

  // Observability / performance (tunable via env)
  private readonly slowBidTxWarnMs = Number(process.env.BID_TX_WARN_MS ?? 250);

  constructor(
    private readonly bidRepository: BidPrismaService,
    private readonly auctionsGateway: AuctionsGateway,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Place a bid with real-time WebSocket broadcast
   */
  async placeBid(
    auctionItemId: string,
    amount: number,
    userId: string,
    tenantId: string,
    requestId: string
  ): Promise<PlaceBidResult> {
    const tStart = process.hrtime.bigint();

    // Defensive validations (avoid DB errors / weird client payloads)
    if (!requestId) {
      throw new BadRequestException('requestId requerido');
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('Monto de puja inválido');
    }
    // Bid.offered_price is Int (int4). Prevent "integer out of range" (2_147_483_647 max).
    if (amount > 2_147_483_647) {
      throw new BadRequestException(
        'Monto de puja excede el máximo permitido'
      );
    }

    // Consistency guarantee:
    // All validations + soft-close extension + bid insert happen in ONE transaction,
    // with a row-level lock on auction_item. This prevents races where two users pass
    // the same "highest bid" validation and both get accepted.
    const SOFT_CLOSE_THRESHOLD_MS = 30 * 1000;
    const SOFT_CLOSE_EXTENSION_MS = 30 * 1000;

    const txResult = await this.prisma.client.$transaction(async (tx) => {
      // ✅ Serialize duplicates by requestId *even before the bid row exists*.
      // Why: if the same requestId arrives twice concurrently, the second transaction
      // may not see the first bid yet (still uncommitted), re-run validations
      // against a newer price, and incorrectly reject the retry with a "mínimo" error.
      // pg_advisory_xact_lock gives us a lightweight, transaction-scoped mutex.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock((hashtext(${requestId}))::bigint)`;
      // ✅ Idempotency inside the transaction (avoids race between "find" and "insert")
      const existing = await tx.bid.findUnique({
        where: { requestId },
        include: {
          user: true,
          auctionItem: { include: { auction: true, item: true } },
        },
      });
      if (existing) {
        if (
          existing.userId !== userId ||
          existing.tenantId !== tenantId ||
          existing.auctionItemId !== auctionItemId
        ) {
          throw new ForbiddenException('requestId inválido');
        }

        const bidPlacedData: BidPlacedData = {
          tenantId,
          auctionId: existing.auctionItem.auctionId,
          auctionItemId,
          bidId: existing.id,
          amount: Number(existing.offered_price),
          userId: existing.userId,
          userName:
            existing.user.public_name ||
            existing.user.name ||
            existing.user.email,
          timestamp: existing.bid_time.getTime(),
          requestId,
          item: {
            id: existing.auctionItem.item.id,
            plate: existing.auctionItem.item.plate || undefined,
            brand: existing.auctionItem.item.brand || undefined,
            model: existing.auctionItem.item.model || undefined,
          },
        };

        return {
          bid: existing as BidWithRelations,
          createdNow: false,
          bidPlacedData,
          extension: null as null | { auctionId: string; auctionItemId: string; newEndTimeIso: string },
        };
      }

      // 🔒 Lock the auction_item row to serialize bids per item.
      const locked = await tx.$queryRaw<
        Array<{
          auctionItemId: string;
          auctionId: string;
          startingBid: number;
          itemStart: Date | null;
          itemEnd: Date | null;
          auctionTenantId: string;
          auctionStatus: string;
          auctionStart: Date;
          auctionEnd: Date;
          bidIncrement: number;
          itemId: string;
          plate: string | null;
          brand: string | null;
          model: string | null;
        }>
      >`
        SELECT
          ai.id            AS "auctionItemId",
          ai."auctionId"   AS "auctionId",
          ai."startingBid" AS "startingBid",
          ai."startTime"   AS "itemStart",
          ai."endTime"     AS "itemEnd",
          a."tenantId"     AS "auctionTenantId",
          a."status"       AS "auctionStatus",
          a."startTime"    AS "auctionStart",
          a."endTime"      AS "auctionEnd",
          a."bidIncrement" AS "bidIncrement",
          i.id             AS "itemId",
          i."plate"        AS "plate",
          i."brand"        AS "brand",
          i."model"        AS "model"
        FROM "public"."auction_item" ai
        JOIN "public"."auction" a ON a.id = ai."auctionId"
        JOIN "public"."item" i ON i.id = ai."itemId"
        WHERE ai.id = ${auctionItemId}
        FOR UPDATE
      `;

      const row = locked?.[0];
      if (!row) {
        throw new NotFoundException('Item de subasta no encontrado');
      }

      if (row.auctionTenantId !== tenantId) {
        throw new ForbiddenException('No tienes acceso a esta subasta');
      }
      if (row.auctionStatus !== 'ACTIVA') {
        throw new BadRequestException('La subasta no está activa');
      }

      const now = new Date();
      const itemStart = row.itemStart ?? row.auctionStart;
      const itemEnd = row.itemEnd ?? row.auctionEnd;

      if (now < itemStart) {
        throw new BadRequestException('El ítem aún no ha comenzado');
      }
      if (now > itemEnd) {
        throw new BadRequestException('El ítem ya finalizó');
      }

      const registration = await tx.auctionRegistration.findUnique({
        where: {
          userId_auctionId: {
            userId,
            auctionId: row.auctionId,
          },
        },
      });
      if (!registration) {
        throw new ForbiddenException(
          'Debes registrarte en la subasta antes de pujar'
        );
      }

      // Compute current highest bid in DB *after* acquiring the lock.
      const maxRows = await tx.$queryRaw<Array<{ max: number | null }>>`
        SELECT MAX(b."offered_price")::int AS "max"
        FROM "public"."bid" b
        WHERE b."auctionItemId" = ${auctionItemId}
          AND b."isDeleted" = false
      `;
      const max = maxRows?.[0]?.max ?? null;
      const bidIncrement = Math.max(1, Number(row.bidIncrement) || 1);

      // Minimum/step rules:
      // - If there is a previous bid, the next minimum is max + bidIncrement.
      // - Otherwise the first minimum is startingBid.
      // - Always enforce increments (you can jump multiple increments, but must align to the step).
      const base = max !== null ? Number(max) : Number(row.startingBid);
      const minimumBid = max !== null ? base + bidIncrement : base;

      if (amount < minimumBid) {
        throw new BadRequestException(
          `La puja debe ser al menos $${minimumBid.toLocaleString()}`
        );
      }

      const diff = amount - base;
      // diff can be 0 only when max is null (first bid equals startingBid)
      if (diff % bidIncrement !== 0) {
        const nextValid = base + Math.ceil(diff / bidIncrement) * bidIncrement;
        throw new BadRequestException(
          `La puja debe respetar el incremento de $${bidIncrement.toLocaleString()}. Próxima puja válida: $${nextValid.toLocaleString()}`
        );
      }

      // Soft-close extension:
      // If we're within the last 30 seconds and someone bids, the product timer must go back to 30 seconds.
      // IMPORTANT: Use DB time (NOW()) for the candidate end. Under load, this request can wait on row locks;
      // if we used a JS 'now' captured before waiting, we'd sometimes extend to <30s remaining.
      let extension: null | { auctionId: string; auctionItemId: string; newEndTimeIso: string } = null;
      const timeUntilEnd = itemEnd.getTime() - now.getTime();
      if (timeUntilEnd <= SOFT_CLOSE_THRESHOLD_MS && timeUntilEnd > 0) {
        const updated = await tx.$queryRaw<Array<{ endTime: Date | string | null }>>`
          UPDATE "public"."auction_item"
          SET
            "startTime" = COALESCE("startTime", ${itemStart}),
            "endTime"   = GREATEST(
              COALESCE("endTime", NOW() + INTERVAL '30 seconds'),
              NOW() + INTERVAL '30 seconds'
            )
          WHERE "id" = ${auctionItemId}
          RETURNING "endTime"
        `;

        const updatedEndTime = updated?.[0]?.endTime
          ? new Date(updated[0].endTime as any)
          : new Date(Date.now() + SOFT_CLOSE_EXTENSION_MS);

        await tx.$executeRaw`
          UPDATE "public"."auction"
          SET "endTime" = GREATEST("endTime", ${updatedEndTime})
          WHERE "id" = ${row.auctionId}
            AND "tenantId" = ${tenantId}
        `;

        if (updatedEndTime.getTime() > itemEnd.getTime()) {
          extension = {
            auctionId: row.auctionId,
            auctionItemId,
            newEndTimeIso: updatedEndTime.toISOString(),
          };
        }
      }

      // Insert bid (idempotent by requestId)
      const bidId = randomUUID();
      const inserted = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "public"."bid"
          ("id","requestId","offered_price","bid_time","userId","auctionId","auctionItemId","tenantId","createdAt","updatedAt")
        VALUES
          (${bidId}, ${requestId}, ${amount}, NOW(), ${userId}, ${row.auctionId}, ${auctionItemId}, ${tenantId}, NOW(), NOW())
        ON CONFLICT ("requestId") DO NOTHING
        RETURNING "id"
      `;

      const bid = await tx.bid.findUnique({
        where: { requestId },
        include: {
          user: true,
          auctionItem: {
            include: { auction: true, item: true },
          },
        },
      });
      if (!bid) {
        throw new Error('No se pudo crear ni recuperar la puja');
      }

      const createdNow = inserted.length > 0;
      const bidPlacedData: BidPlacedData = {
        tenantId,
        auctionId: bid.auctionItem.auctionId,
        auctionItemId,
        bidId: bid.id,
        amount: Number(bid.offered_price),
        userId: bid.userId,
        userName: bid.user.public_name || bid.user.name || bid.user.email,
        timestamp: bid.bid_time.getTime(),
        requestId,
        item: {
          id: bid.auctionItem.item.id,
          plate: bid.auctionItem.item.plate || undefined,
          brand: bid.auctionItem.item.brand || undefined,
          model: bid.auctionItem.item.model || undefined,
        },
      };

      return {
        bid: bid as BidWithRelations,
        createdNow,
        bidPlacedData,
        extension,
      };
    });

    const tAfterTx = process.hrtime.bigint();
    const txMs = Number(tAfterTx - tStart) / 1e6;

    // Broadcast AFTER COMMIT (prevents UI from getting out of sync if a tx later fails)
    if (txResult.createdNow) {
      const bStart = process.hrtime.bigint();
      this.logger.log(
        `Bid placed [req=${requestId}]: ${amount} by ${
          txResult.bid.user.email
        } on item ${txResult.bid.auctionItem.item.plate || auctionItemId}`
      );

      // Client requirement:
      // - USER must see only the pseudonym (public_name)
      // - AUCTION_MANAGER/ADMIN must see the real name (or email fallback)
      const userDisplayName =
        txResult.bid.user.public_name ||
        // fallback to a generic label if public_name is missing
        'Usuario';
      const managerDisplayName =
        txResult.bid.user.name ||
        txResult.bid.user.email ||
        txResult.bid.user.public_name ||
        'Usuario';

      this.auctionsGateway.broadcastBidPlaced(
        `${tenantId}:${txResult.bid.auctionItem.auctionId}`,
        txResult.bidPlacedData,
        { userDisplayName, managerDisplayName }
      );

      if (txResult.extension) {
        this.auctionsGateway.broadcastToRoom(
          `${tenantId}:${txResult.extension.auctionId}`,
          {
            event: 'AUCTION_TIME_EXTENDED',
            data: {
              auctionId: txResult.extension.auctionId,
              auctionItemId: txResult.extension.auctionItemId,
              newEndTime: txResult.extension.newEndTimeIso,
              extensionSeconds: SOFT_CLOSE_EXTENSION_MS / 1000,
              serverTimeMs: Date.now(),
            },
          }
        );

        // Tenant-wide broadcast so the "Mis subastas" list can update timers even before joining the auction room.
        this.auctionsGateway.broadcastToRoom(
          `${tenantId}:__TENANT__`,
          {
            event: 'AUCTION_TIME_EXTENDED',
            data: {
              auctionId: txResult.extension.auctionId,
              auctionItemId: txResult.extension.auctionItemId,
              newEndTime: txResult.extension.newEndTimeIso,
              extensionSeconds: SOFT_CLOSE_EXTENSION_MS / 1000,
              serverTimeMs: Date.now(),
            },
          }
        );
      }

      const bEnd = process.hrtime.bigint();
      const broadcastMs = Number(bEnd - bStart) / 1e6;
      const totalMs = Number(process.hrtime.bigint() - tStart) / 1e6;

      // Performance log (can be used for dashboards/alerts)
      const msg = `[bid-latency] req=${requestId} item=${auctionItemId} amount=${amount} txMs=${txMs.toFixed(
        1
      )} broadcastMs=${broadcastMs.toFixed(1)} totalMs=${totalMs.toFixed(1)}`;
      if (txMs >= this.slowBidTxWarnMs) {
        this.logger.warn(msg);
      } else {
        this.logger.debug(msg);
      }
    } else {
      // Duplicate requestId or already processed; still log tx latency at debug
      const totalMs = Number(process.hrtime.bigint() - tStart) / 1e6;
      this.logger.debug(
        `[bid-latency] req=${requestId} item=${auctionItemId} createdNow=false txMs=${txMs.toFixed(
          1
        )} totalMs=${totalMs.toFixed(1)}`
      );
    }

    return {
      bid: txResult.bid,
      createdNow: txResult.createdNow,
      bidPlacedData: txResult.bidPlacedData,
    };
  }

  /**
   * Get bid history for an auction item
   */
  async getBidHistory(
    auctionItemId: string,
    tenantId: string,
    limit = 50
  ): Promise<BidWithRelations[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionItemId,
        tenantId,
        isDeleted: false,
      },
      distinct: ['id'], // Ensure unique bids by ID
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
      take: limit,
    });

    return bids as BidWithRelations[];
  }

  /**
   * Get highest bid for an auction item
   */
  async getHighestBid(
    auctionItemId: string,
    tenantId: string
  ): Promise<BidWithRelations | null> {
    const bid = await this.prisma.bid.findFirst({
      where: {
        auctionItemId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        offered_price: 'desc',
      },
    });

    return bid as BidWithRelations | null;
  }

  /**
   * Get all bids for an auction
   */
  async getAuctionBids(
    auctionId: string,
    tenantId: string
  ): Promise<BidWithRelations[]> {
    this.logger.log(
      `[getAuctionBids] Fetching bids for auction ${auctionId}, tenant ${tenantId}`
    );

    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        tenantId,
        isDeleted: false,
      },
      distinct: ['id'], // Ensure unique bids by ID
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
    });

    this.logger.log(
      `[getAuctionBids] Found ${bids.length} bids for auction ${auctionId}`
    );

    return bids as BidWithRelations[];
  }

  /**
   * Get user's bids for an auction
   */
  async getUserAuctionBids(
    auctionId: string,
    userId: string,
    tenantId: string
  ): Promise<BidWithRelations[]> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        userId,
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            public_name: true,
          },
        },
        auctionItem: {
          include: {
            auction: true,
            item: true,
          },
        },
      },
      orderBy: {
        bid_time: 'desc',
      },
    });

    return bids as BidWithRelations[];
  }

  /**
   * Broadcast auction status change to all participants
   */
  async broadcastAuctionStatusChange(
    auctionId: string,
    tenantId: string,
    status: string
  ) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) return;

    this.auctionsGateway.broadcastToRoom(`${tenantId}:${auctionId}`, {
      event: 'AUCTION_STATUS_CHANGED',
      data: {
        auctionId,
        tenantId,
        status,
        title: auction.title,
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
      },
    });

    this.logger.log(`Auction ${auctionId} status changed to ${status}`);
  }
}
