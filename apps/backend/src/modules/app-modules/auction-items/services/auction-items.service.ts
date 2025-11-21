import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuctionItemPrismaService } from './auction-item-prisma.service';
import {
  AuctionItemDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';

@Injectable()
export class AuctionItemsService {
  constructor(
    private readonly auctionItemRepository: AuctionItemPrismaService
  ) {}

  async getAuctionItemsByAuctionId(
    auctionId: string,
    tenantId: string
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

    // Get all auction items for this auction with item and bids
    return this.auctionItemRepository.getAuctionItemsByAuctionId(auctionId);
  }

  async getAuctionItemById(
    id: string,
    tenantId: string
  ): Promise<AuctionItemDto> {
    const auctionItem = await this.auctionItemRepository.getAuctionItemById(id);
    const auction = await this.auctionItemRepository.getAuctionWithTenant(id);
    if (!auctionItem) {
      throw new NotFoundException('Item de subasta no encontrado');
    }

    // Verify tenant access through the auction
    if (auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este item');
    }

    return auctionItem;
  }
}
