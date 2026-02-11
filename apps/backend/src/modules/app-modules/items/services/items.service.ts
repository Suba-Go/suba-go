import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ItemPrismaRepository } from './item-prisma-repository.service';
import { CreateItemDto, UpdateItemDto, ItemStatsDto } from '../dto/item.dto';
import type { Item, AuctionItem, Auction, Prisma } from '@prisma/client';
import { ItemStateEnum, LegalStatusEnum } from '@prisma/client';

type ItemWithRelations = Item & {
  auctionItems?: (AuctionItem & {
    auction?: Auction;
  })[];
};

// Prisma "Item" type does NOT include relation fields (like auctionItems) unless you
// explicitly model it in the service layer. We use this alias to safely access relations
// when the repository includes them.


@Injectable()
export class ItemsService {
  constructor(private readonly itemRepository: ItemPrismaRepository) {}

  private normalizePhotoUrl(url: string): string {
    let u = String(url).trim();
    if (!u) return u;

    // Vercel Blob paths are case-sensitive; historically some records were saved with "/Uploads/".
    u = u.replaceAll('/Uploads/', '/uploads/');
    u = u.replace(/%2FUploads%2F/gi, '%2Fuploads%2F');

    // Add scheme when omitted (common when saving host/path)
    if (u.startsWith('//')) u = `https:${u}`;
    else if (!/^https?:\/\//i.test(u)) {
      const first = u.split('/')[0] ?? '';
      if (first.includes('.')) u = `https://${u}`;
    }

    return u;
  }

  private normalizePhotosField(photos?: string | null): string | undefined {
    if (!photos) return undefined;
    const raw = String(photos).trim();
    if (!raw) return undefined;

    // First fix easy string-replace issues at the whole-string level.
    const fixedRaw = raw
      .replaceAll('/Uploads/', '/uploads/')
      .replace(/%2FUploads%2F/gi, '%2Fuploads%2F');

    // If it's a JSON array string, normalize each element.
    if (fixedRaw.startsWith('[')) {
      try {
        const arr = JSON.parse(fixedRaw);
        if (Array.isArray(arr)) {
          const normalized = arr
            .filter((x) => typeof x === 'string' && String(x).trim().length > 0)
            .map((x) => this.normalizePhotoUrl(String(x)));
          return JSON.stringify(normalized);
        }
      } catch {
        // fallthrough
      }
    }

    // Otherwise treat it as CSV or single URL string.
    const parts = fixedRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => this.normalizePhotoUrl(p));

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return JSON.stringify([parts[0]]);
    return JSON.stringify(parts);
  }

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

    // Ensure required fields are present (TypeScript should catch this, but we validate at runtime too)
    if (!itemData.plate) {
      throw new BadRequestException('La patente es requerida');
    }
    if (!itemData.brand) {
      throw new BadRequestException('La marca es requerida');
    }
    if (!itemData.basePrice || itemData.basePrice <= 0) {
      throw new BadRequestException('El precio base es requerido y debe ser positivo');
    }

    // Build the create input with all required fields explicitly typed
    const createInput: Prisma.ItemCreateInput = {
      plate: itemData.plate,
      brand: itemData.brand,
      model: itemData.model,
      year: itemData.year,
      version: itemData.version,
      kilometraje: itemData.kilometraje,
      basePrice: itemData.basePrice,
      // Normalize photos to avoid broken Vercel Blob URLs (case sensitivity, missing scheme, CSV vs JSON)
      photos: this.normalizePhotosField(itemData.photos),
      docs: itemData.docs,
      state,
      legal_status: legalStatus,
      tenant: {
        connect: { id: tenantId },
      },
    };

    return this.itemRepository.create(createInput);
  }

  async getItemsByTenant(tenantId: string): Promise<Item[]> {
    return this.itemRepository.findByTenant(tenantId);
  }

  async getAvailableItems(tenantId: string): Promise<Item[]> {
    return this.itemRepository.findAvailableItems(tenantId);
  }

  async getItemById(
    id: string,
    tenantId: string,
    access?: { role?: string; userId?: string }
  ): Promise<ItemWithRelations> {
    // Repository includes auctionItems + auction, but its TS signature is scalar Item.
    // Cast here to keep service-level typing correct.
    const item = (await this.itemRepository.findById(id)) as unknown as
      | ItemWithRelations
      | null;

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este item');
    }

    // Additional guard for USER role: only allow access if the user either
    // 1) won this item (soldToUserId), or
    // 2) is registered/invited to at least one auction that contains this item.
    if (access?.role === 'USER') {
      const userId = access.userId;
      if (!userId) {
        throw new ForbiddenException('No tienes acceso a este item');
      }

      // Winner can always see their awarded item.
      if (item.soldToUserId && item.soldToUserId === userId) {
        return item;
      }

      const auctionIds = Array.from(
        new Set(
          (item.auctionItems ?? [])
            .map((ai) => ai.auctionId ?? ai.auction?.id)
            .filter(Boolean)
        )
      ) as string[];

      const registered = await this.itemRepository.isUserRegisteredForAuctions(
        userId,
        auctionIds
      );

      if (!registered) {
        throw new ForbiddenException('No tienes acceso a este item');
      }
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

    const normalizedUpdate: UpdateItemDto = {
      ...updateItemDto,
      ...(updateItemDto.photos !== undefined
        ? { photos: this.normalizePhotosField(updateItemDto.photos) }
        : {}),
    };

    return this.itemRepository.update(id, normalizedUpdate);
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
      this.itemRepository.findByState(ItemStateEnum.DISPONIBLE, tenantId),
      this.itemRepository.findByState(ItemStateEnum.EN_SUBASTA, tenantId),
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

  async getItemsSoldToUser(userId: string, tenantId: string): Promise<Item[]> {
    const items = await this.itemRepository.findSoldToUser(userId, tenantId);
    
    // Process photos field to ensure consistent array format
    // This is needed because sometimes photos might be stored as stringified JSON or plain string
    return items.map((item) => {
      const processedItem = { ...item };
      // Ensure we always return a consistent JSON array string and fix common URL issues.
      processedItem.photos = this.normalizePhotosField(processedItem.photos) as any;
      return processedItem;
    });
  }
}
