import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ItemPrismaRepository } from './item-prisma-repository.service';
import { CreateItemDto, UpdateItemDto, ItemStatsDto } from '../dto/item.dto';
import type { Item, AuctionItem, Auction } from '@prisma/client';
import { ItemStateEnum, LegalStatusEnum } from '@prisma/client';

type ItemWithRelations = Item & {
  auctionItems?: (AuctionItem & {
    auction?: Auction;
  })[];
};

@Injectable()
export class ItemsService {
  constructor(private readonly itemRepository: ItemPrismaRepository) {}

  async createItem(
    createItemDto: CreateItemDto,
    tenantId: string
  ): Promise<Item> {
    // Validate that plate is unique within tenant
    const existingItem = await this.itemRepository.findByPlate(
      createItemDto.plate
    );
    if (existingItem && existingItem.tenantId === tenantId) {
      throw new BadRequestException(
        'Ya existe un item con esta placa en el tenant'
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId: dtoTenantId, ...itemData } =
      createItemDto as CreateItemDto & {
        tenantId?: string;
      };

    // Convert string enums to Prisma enums
    let state: ItemStateEnum = ItemStateEnum.DISPONIBLE;
    if (itemData.state) {
      // Use the enum value directly or convert from string
      if (typeof itemData.state === 'string') {
        // Map string values to enum values
        const stateMap: Record<string, ItemStateEnum> = {
          Disponible: ItemStateEnum.DISPONIBLE,
          'En Subasta': ItemStateEnum.EN_SUBASTA,
          Vendido: ItemStateEnum.VENDIDO,
          Eliminado: ItemStateEnum.ELIMINADO,
        };
        state = stateMap[itemData.state] || ItemStateEnum.DISPONIBLE;
      } else {
        // Already an enum value
        state = itemData.state as ItemStateEnum;
      }
    }

    let legalStatus: LegalStatusEnum = LegalStatusEnum.TRANSFERIBLE;
    if (itemData.legal_status === 'TRANSFERIBLE') {
      legalStatus = LegalStatusEnum.TRANSFERIBLE;
    } else if (itemData.legal_status === 'LEASING') {
      legalStatus = LegalStatusEnum.LEASING;
    } else if (itemData.legal_status === 'POSIBILIDAD_DE_EMBARGO') {
      legalStatus = LegalStatusEnum.POSIBILIDAD_DE_EMBARGO;
    } else if (itemData.legal_status === 'PRENDA') {
      legalStatus = LegalStatusEnum.PRENDA;
    } else if (itemData.legal_status === 'OTRO') {
      legalStatus = LegalStatusEnum.OTRO;
    }

    return this.itemRepository.create({
      ...itemData,
      state,
      legal_status: legalStatus,
      tenant: {
        connect: { id: tenantId },
      },
    });
  }

  async getItemsByTenant(tenantId: string): Promise<Item[]> {
    return this.itemRepository.findByTenant(tenantId);
  }

  async getAvailableItems(tenantId: string): Promise<Item[]> {
    return this.itemRepository.findAvailableItems(tenantId);
  }

  async getItemById(id: string, tenantId: string): Promise<ItemWithRelations> {
    const item = await this.itemRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este item');
    }

    return item;
  }

  async updateItem(
    id: string,
    updateItemDto: UpdateItemDto,
    tenantId: string
  ): Promise<Item> {
    const existingItem = await this.getItemById(id, tenantId);

    // Validate plate uniqueness if it's being updated
    if (updateItemDto.plate && updateItemDto.plate !== existingItem.plate) {
      const itemWithPlate = await this.itemRepository.findByPlate(
        updateItemDto.plate
      );
      if (
        itemWithPlate &&
        itemWithPlate.tenantId === tenantId &&
        itemWithPlate.id !== id
      ) {
        throw new BadRequestException(
          'Ya existe un item con esta placa en el tenant'
        );
      }
    }

    return this.itemRepository.update(id, updateItemDto);
  }

  async deleteItem(id: string, tenantId: string): Promise<void> {
    const item = await this.getItemById(id, tenantId);

    // Check if item is being used in any active auction
    const hasActiveAuctions = item.auctionItems?.some(
      (auctionItem) => auctionItem.auction?.status === 'ACTIVA'
    );

    if (hasActiveAuctions) {
      throw new BadRequestException(
        'No se puede eliminar un item que está en una subasta activa'
      );
    }

    await this.itemRepository.softDelete(id);
  }

  async getItemStats(tenantId: string): Promise<ItemStatsDto> {
    const [totalItems, availableItems, inAuctionItems] = await Promise.all([
      this.itemRepository.count(tenantId),
      this.itemRepository.findByState('DISPONIBLE', tenantId),
      this.itemRepository.findByState('EN_SUBASTA', tenantId),
    ]);

    return {
      totalItems,
      availableItems: availableItems.length,
      inAuctionItems: inAuctionItems.length,
      soldItems: totalItems - availableItems.length - inAuctionItems.length,
    };
  }

  async getItemsByState(state: string, tenantId: string): Promise<Item[]> {
    return this.itemRepository.findByState(state, tenantId);
  }

  async updateItemState(
    id: string,
    state: string,
    tenantId: string
  ): Promise<Item> {
    await this.getItemById(id, tenantId); // Validate access

    return this.itemRepository.update(id, { state: state as ItemStateEnum });
  }
}
