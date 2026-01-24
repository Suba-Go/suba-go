import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuctionItemPrismaService } from './auction-item-prisma.service';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import {
  AuctionItemDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';

@Injectable()
export class AuctionItemsService {
  constructor(
    private readonly auctionItemRepository: AuctionItemPrismaService,
    private readonly prisma: PrismaService
  ) {}

  async getAuctionItemsByAuctionId(
    auctionId: string,
    tenantId: string,
    requester?: { userId?: string; role?: string }
  ): Promise<AuctionItemWithItmeAndBidsDto[]> {
    // First verify that the auction exists and belongs to the tenant
    const auction = await this.auctionItemRepository.getAuctionWithTenant(
      auctionId
    );

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    if (auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta subasta');
    }

    // Client requirement: USER must be invited/registered to view auction items
    if (requester?.role === 'USER') {
      const userId = requester.userId;
      if (!userId) {
        throw new ForbiddenException('No tienes acceso a esta subasta');
      }

      const registration = await this.prisma.auctionRegistration.findFirst({
        where: { auctionId, userId },
        select: { id: true },
      });

      if (!registration) {
        throw new ForbiddenException('No estás invitado a esta subasta');
      }
    }

    // Get all auction items for this auction with item and bids
    return this.auctionItemRepository.getAuctionItemsByAuctionId(auctionId);
  }

  async getAuctionItemById(
    id: string,
    tenantId: string,
    requester?: { userId?: string; role?: string }
  ): Promise<AuctionItemDto> {
    const auctionItem = await this.auctionItemRepository.getAuctionItemById(id);
    if (!auctionItem) throw new NotFoundException('Item de subasta no encontrado');

    const auction = await this.auctionItemRepository.getAuctionWithTenant(
      auctionItem.auctionId
    );
    if (!auction) throw new NotFoundException('Subasta no encontrada');

    // Verify tenant access through the auction
    if (auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este item');
    }

    if (requester?.role === 'USER') {
      const userId = requester.userId;
      if (!userId) {
        throw new ForbiddenException('No tienes acceso a este item');
      }

      const registration = await this.prisma.auctionRegistration.findFirst({
        where: { auctionId: auction.id, userId },
        select: { id: true },
      });

      if (!registration) {
        throw new ForbiddenException('No estás invitado a esta subasta');
      }
    }

    return auctionItem as any;
  }
}
