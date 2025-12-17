import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';

@Injectable()
export class UserStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStatistics(userId: string) {
    // 1. Participations in auctions (details)
    const participations = await this.prisma.auctionRegistration.findMany({
      where: { userId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            status: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const participationCount = participations.length;

    // 2. Average Bids per Item (Count)
    const totalBids = await this.prisma.bid.count({
      where: { userId },
    });

    const uniqueItemsBidOn = await this.prisma.bid.groupBy({
      by: ['auctionItemId'],
      where: { userId },
    });
    const totalUniqueItems = uniqueItemsBidOn.length;

    const averageBidsPerItem =
      totalUniqueItems > 0 ? totalBids / totalUniqueItems : 0;

    // 3. Won Items (Adjudicados)
    const wonItems = await this.prisma.item.findMany({
      where: {
        soldToUserId: userId,
      },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        soldPrice: true,
        auctionItems: {
          select: {
            auctionId: true,
          },
        },
      },
    });

    // Calculate Win Rate
    // (Won Items / Items Bid On) * 100
    const winRate =
      totalUniqueItems > 0 ? (wonItems.length / totalUniqueItems) * 100 : 0;

    // Calculate Second Place Rate (or Participation without Win Rate)
    // (items lost / total unique items) * 100
    const itemsLost = totalUniqueItems - wonItems.length;
    const secondPlaceRate =
      totalUniqueItems > 0 ? (itemsLost / totalUniqueItems) * 100 : 0;

    // 5. Bidding Trend (Days of Week)
    const biddingTrendRaw = await this.prisma.client.$queryRaw<{ day: number; count: bigint }[]>`
      SELECT EXTRACT(DOW FROM "createdAt") as day, COUNT(*) as count
      FROM "bid"
      WHERE "userId" = ${userId}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Initialize counts for all days (0=Sunday to 6=Saturday)
    const daysMap = new Map<number, number>();
    biddingTrendRaw.forEach((row) => {
      daysMap.set(Number(row.day), Number(row.count));
    });

    // Format for frontend: Start from Monday (1) to Sunday (0)
    const daysOfWeek = [
      { id: 1, label: 'Lun' },
      { id: 2, label: 'Mar' },
      { id: 3, label: 'Mié' },
      { id: 4, label: 'Jue' },
      { id: 5, label: 'Vie' },
      { id: 6, label: 'Sáb' },
      { id: 0, label: 'Dom' },
    ];

    const biddingTrend = daysOfWeek.map((day) => ({
      day: day.label,
      count: daysMap.get(day.id) || 0,
    }));

    return {
      participationCount,
      participatedAuctions: participations.map((p) => {
        // Count how many won items belong to this auction
        const itemsWonInThisAuction = wonItems.filter((item) =>
          item.auctionItems.some((ai) => ai.auctionId === p.auction.id)
        ).length;

        return {
          id: p.auction.id,
          title: p.auction.title,
          status: p.auction.status,
          startTime: p.auction.startTime,
          endTime: p.auction.endTime,
          itemsWonCount: itemsWonInThisAuction,
        };
      }),
      averageBidsPerItem: Number(averageBidsPerItem.toFixed(1)),
      winRate: Number(winRate.toFixed(1)),
      secondPlaceRate: Number(secondPlaceRate.toFixed(1)),
      wonItems: wonItems.map((item) => ({
        id: item.id,
        name: `${item.brand} ${item.model || ''} - ${item.plate}`,
        price: item.soldPrice,
        auctionId: item.auctionItems[0]?.auctionId,
      })),
      biddingTrend,
    };
  }
}
