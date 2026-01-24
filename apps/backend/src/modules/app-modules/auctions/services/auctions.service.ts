import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuctionPrismaService } from './auction-prisma.service';
import { AuctionsGateway } from '../../../providers-modules/realtime/auctions.gateway';
import { UpdateAuctionDto, AuctionStatsDto, CreateAuctionDto } from '../dto/auction.dto';
import type { Auction } from '@prisma/client';
import {
  AuctionStatusEnum,
  AuctionTypeEnum as PrismaAuctionTypeEnum,
} from '@prisma/client';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import {
  AuctionCreateDto,
  AuctionWithItemsAndBidsDto,
  AuctionTypeEnum as SharedAuctionTypeEnum,
} from '@suba-go/shared-validation';

@Injectable()
export class AuctionsService {
  constructor(
    private readonly auctionRepository: AuctionPrismaService,
    private readonly prisma: PrismaService,
    private readonly auctionsGateway: AuctionsGateway
  ) {}

async createAuction(
    createAuctionDto: CreateAuctionDto | AuctionCreateDto,
    tenantId: string
  ): Promise<Auction> {
    if (createAuctionDto.startTime >= createAuctionDto.endTime) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio'
      );
    }

    if (createAuctionDto.startTime < new Date()) {
      throw new BadRequestException('La fecha de inicio debe ser futura');
    }

    if (createAuctionDto.bidIncrement <= 0) {
      throw new BadRequestException('El incremento de puja debe ser positivo');
    }

    let auctionType: PrismaAuctionTypeEnum = PrismaAuctionTypeEnum.REAL;
    if (createAuctionDto.type === SharedAuctionTypeEnum.TEST) {
      auctionType = PrismaAuctionTypeEnum.TEST;
    } else if (createAuctionDto.type === SharedAuctionTypeEnum.REAL) {
      auctionType = PrismaAuctionTypeEnum.REAL;
    }

    const normalizedItemIds =
      (createAuctionDto as any).itemIds ??
      (createAuctionDto as any).selectedItems ??
      [];

    const auction = await this.auctionRepository.createAuction({
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startTime: createAuctionDto.startTime,
      endTime: createAuctionDto.endTime,
      tenantId,
      type: auctionType,
      bidIncrement: createAuctionDto.bidIncrement,
      itemIds: normalizedItemIds,
    });

    if (normalizedItemIds?.length) {
      try {
        await this.auctionRepository.addItemsToAuction(auction.id, normalizedItemIds);
      } catch (err) {
        await this.auctionRepository.deleteAuction(auction.id);
        throw err;
      }
    }

    return this.auctionRepository.getAuctionById(auction.id);
  }


  async getAuctionsByTenant(
    tenantId: string
  ): Promise<AuctionWithItemsAndBidsDto[]> {
    return this.auctionRepository.getAuctionsByTenant(tenantId);
  }

  async getUserAuctionRegistrations(userId: string): Promise<any[]> {
    return this.auctionRepository.getUserAuctionRegistrations(userId);
  }

  async getUserActiveRegisteredAuctions(
    userId: string,
    tenantId: string
  ): Promise<Auction[]> {
    return this.auctionRepository.getUserActiveRegisteredAuctions(
      userId,
      tenantId
    );
  }

    async getAuctionById(
    id: string,
    tenantId: string,
    requester?: { userId?: string; role?: string }
  ): Promise<Auction> {
    const auction = await this.auctionRepository.getAuctionById(id);

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    if (auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta subasta');
    }

    // Client requirement: USER must be invited/registered to view an auction
    if (requester?.role === 'USER') {
      const userId = requester.userId;
      if (!userId) {
        throw new ForbiddenException('No tienes acceso a esta subasta');
      }

      const registration = await this.prisma.auctionRegistration.findFirst({
        where: {
          auctionId: id,
          userId,
        },
        select: { id: true },
      });

      if (!registration) {
        throw new ForbiddenException('No estás invitado a esta subasta');
      }
    }

    return auction;
  }

  async updateAuction(
    id: string,
    updateAuctionDto: UpdateAuctionDto,
    tenantId: string
  ): Promise<Auction> {
    const existingAuction = await this.getAuctionById(id, tenantId);

    // Validate that auction can be updated (PENDIENTE or CANCELADA)
    if (
      existingAuction.status !== AuctionStatusEnum.PENDIENTE &&
      existingAuction.status !== AuctionStatusEnum.CANCELADA
    ) {
      throw new BadRequestException(
        'No se puede modificar una subasta activa o completada'
      );
    }

    // Validate dates if provided
    if (updateAuctionDto.startTime && updateAuctionDto.endTime) {
      if (updateAuctionDto.startTime >= updateAuctionDto.endTime) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio'
        );
      }
    }

    // Convert string type to enum if provided
    let auctionType: PrismaAuctionTypeEnum | undefined;
    if (updateAuctionDto.type) {
      if (updateAuctionDto.type === SharedAuctionTypeEnum.TEST) {
        auctionType = PrismaAuctionTypeEnum.TEST;
      } else if (updateAuctionDto.type === SharedAuctionTypeEnum.REAL) {
        auctionType = PrismaAuctionTypeEnum.REAL;
      }
    }

    // Update auction basic data
    await this.auctionRepository.updateAuction(id, {
      title: updateAuctionDto.title,
      description: updateAuctionDto.description,
      startTime: updateAuctionDto.startTime,
      endTime: updateAuctionDto.endTime,
      type: auctionType,
      bidIncrement: updateAuctionDto.bidIncrement,
    });

    // If auction was CANCELADA and is being edited, change status to PENDIENTE
    if (existingAuction.status === AuctionStatusEnum.CANCELADA) {
      await this.auctionRepository.updateAuctionStatus(
        id,
        AuctionStatusEnum.PENDIENTE
      );
    }

    // Update selected items if provided
    if (updateAuctionDto.selectedItems) {
      const rawSelected = updateAuctionDto.selectedItems as unknown;
      const desiredItemIdsRaw: string[] = Array.isArray(rawSelected)
        ? rawSelected.filter(
            (v): v is string => typeof v === 'string' && v.trim().length > 0
          )
        : [];

      const desiredItemIds: string[] = Array.from(new Set(desiredItemIdsRaw));

      const currentItemIdsRaw: string[] = Array.isArray((existingAuction as any).items)
        ? (existingAuction as any).items
            .filter((ai: any) => ai && !ai.isDeleted)
            .map((ai: any) => ai.itemId)
            .filter(
              (v: any): v is string => typeof v === 'string' && v.trim().length > 0
            )
        : [];

      const currentItemIds: string[] = Array.from(new Set(currentItemIdsRaw));

      const currentSet = new Set<string>(currentItemIds);
      const desiredSet = new Set<string>(desiredItemIds);

      const itemsToAdd = desiredItemIds.filter(
        (itemId) => !currentSet.has(itemId)
      );
      const itemsToRemove = currentItemIds.filter(
        (itemId) => !desiredSet.has(itemId)
      );

      // Remove deselected items (non-destructive diff update)
      if (itemsToRemove.length > 0) {
        await this.auctionRepository.removeItemsFromAuction(id, itemsToRemove);
      }

      // Add newly selected items
      if (itemsToAdd.length > 0) {
        await this.auctionRepository.addItemsToAuction(id, itemsToAdd);
      }
    }

// Return updated auction with items
    return this.auctionRepository.getAuctionById(id);
  }

  async deleteAuction(id: string, tenantId: string): Promise<void> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status === 'ACTIVA') {
      throw new BadRequestException('No se puede eliminar una subasta activa');
    }

    // Release reserved items so they can be reused in other auctions
    await this.auctionRepository.removeAllItemsFromAuction(id);

    await this.auctionRepository.deleteAuction(id);
  }

  async getAuctionStats(tenantId: string): Promise<AuctionStatsDto> {
    const stats = await this.auctionRepository.getAuctionStats(tenantId);

    return {
      totalAuctions: stats.totalAuctions,
      activeAuctions: stats.activeAuctions,
      totalParticipants: stats.totalParticipants,
      totalRevenue: stats.totalRevenue,
    };
  }

  async getActiveAuctions(tenantId: string): Promise<Auction[]> {
    return this.auctionRepository.getActiveAuctions(tenantId);
  }

  async startAuction(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status !== AuctionStatusEnum.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden iniciar subastas pendientes'
      );
    }

    if (new Date() < auction.startTime) {
      throw new BadRequestException(
        'La subasta no puede iniciarse antes de su fecha programada'
      );
    }

    return this.auctionRepository.updateAuctionStatus(id, 'ACTIVA');
  }

  async closeAuction(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status !== 'ACTIVA') {
      throw new BadRequestException('Solo se pueden cerrar subastas activas');
    }

    return this.auctionRepository.closeAuction(id);
  }

async cancelAuction(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status === 'COMPLETADA' || auction.status === 'ELIMINADA') {
      throw new BadRequestException(
        'No se puede cancelar una subasta finalizada o eliminada'
      );
    }
    if (auction.status === 'CANCELADA') {
      return auction;
    }

    const bidCount = await this.prisma.bid.count({
      where: { auctionId: id },
    });

    if (bidCount > 0 && auction.status === 'ACTIVA') {
      this.prisma.auditLog.create({
        data: {
          action: 'AUCTION_CANCELLED_WITH_BIDS',
          entityType: 'Auction',
          entityId: id,
          changes: { bidCount, previousStatus: auction.status, tenantId },
        },
      });
    }

    const updated = await this.auctionRepository.updateAuctionStatus(
      id,
      'CANCELADA'
    );

    // Release reserved items (auction cancelled -> items become available)
    await this.auctionRepository.releaseItemsFromAuction(id);

    this.auctionsGateway.broadcastAuctionStatusChange(
      tenantId,
      id,
      'CANCELADA',
      updated
    );

    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'AUCTION_CANCELLED',
          entityType: 'Auction',
          entityId: id,
          changes: { previousStatus: auction.status },
        },
      });
    } catch (e) {
      console.error('Error creating audit log:', e);
    }

    return updated;
  }


  async uncancelAuction(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status !== 'CANCELADA') {
      throw new BadRequestException(
        'Solo se pueden descancelar subastas canceladas'
      );
    }

    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    let newStatus: 'PENDIENTE' | 'ACTIVA' = 'PENDIENTE';

    if (now >= startTime && now < endTime) {
      newStatus = 'ACTIVA';
    } else if (now >= endTime) {
      throw new BadRequestException(
        'No se puede descancelar una subasta cuya fecha de fin ya pasó'
      );
    }

    // Re-reserve items for this auction; if any item is currently in another auction,
    // this will throw an Error.
    const itemIds = auction.itemIds ?? [];
    if (itemIds.length > 0) {
      await this.auctionRepository.reserveItemsFromAuction(id);
    }

    const updated = await this.auctionRepository.updateAuctionStatus(
      id,
      newStatus
    );

    // Realtime: broadcast status change so all clients update immediately.
    this.auctionsGateway.broadcastAuctionStatusChange(
      tenantId,
      id,
      newStatus,
      updated
    );

    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'AUCTION_UNCANCELLED',
          entityType: 'Auction',
          entityId: id,
          changes: { previousStatus: auction.status, newStatus },
        },
      });
    } catch (e) {
      // Non-blocking
      console.error('Error creating audit log:', e);
    }

    return updated;
  }

  async registerUserToAuction(
    auctionId: string,
    userId: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify auction exists and belongs to tenant
    const auction = await this.getAuctionById(auctionId, tenantId);

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    // Register user
    await this.auctionRepository.registerUserToAuction(auctionId, userId);

    return {
      success: true,
      message: 'Usuario registrado exitosamente',
    };
  }

  async unregisterUserFromAuction(
    auctionId: string,
    userId: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    // Verify auction exists and belongs to tenant
    const auction = await this.getAuctionById(auctionId, tenantId);

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    // Unregister user
    await this.auctionRepository.unregisterUserFromAuction(auctionId, userId);

    return {
      success: true,
      message: 'Usuario desregistrado exitosamente',
    };
  }

  async getAuctionParticipants(auctionId: string, tenantId: string) {
    // Verify auction exists and belongs to tenant
    const auction = await this.getAuctionById(auctionId, tenantId);

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    // Get registered participants
    return this.auctionRepository.getAuctionParticipants(auctionId);
  }
}
