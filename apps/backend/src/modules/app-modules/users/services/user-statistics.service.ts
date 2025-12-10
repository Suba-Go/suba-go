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

    // 4. Debt (Sum of soldPrice)
    const debtStats = await this.prisma.item.aggregate({
      where: {
        soldToUserId: userId,
      },
      _sum: {
        soldPrice: true,
      },
    });

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
      totalDebt: debtStats._sum.soldPrice || 0,
    };
  }
}
