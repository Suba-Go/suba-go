import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuctionPrismaService } from './auction-prisma.service';
import { AuctionsGateway } from '../../../providers-modules/realtime/auctions.gateway';
import { UpdateAuctionDto, AuctionStatsDto } from '../dto/auction.dto';
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
    createAuctionDto: AuctionCreateDto,
    tenantId: string
  ): Promise<Auction> {
    // Validate dates
    if (createAuctionDto.startTime >= createAuctionDto.endTime) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio'
      );
    }

    if (createAuctionDto.startTime < new Date()) {
      throw new BadRequestException('La fecha de inicio debe ser futura');
    }

    // Validate bid increment
    if (createAuctionDto.bidIncrement <= 0) {
      throw new BadRequestException('El incremento de puja debe ser positivo');
    }

    // Convert string type to enum
    let auctionType: PrismaAuctionTypeEnum = PrismaAuctionTypeEnum.REAL;
    if (createAuctionDto.type === SharedAuctionTypeEnum.TEST) {
      auctionType = PrismaAuctionTypeEnum.TEST;
    } else if (createAuctionDto.type === SharedAuctionTypeEnum.REAL) {
      auctionType = PrismaAuctionTypeEnum.REAL;
    }

    const auction = await this.auctionRepository.createAuction({
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startTime: createAuctionDto.startTime,
      endTime: createAuctionDto.endTime,
      tenantId,
      type: auctionType,
      bidIncrement: createAuctionDto.bidIncrement,
      itemIds: createAuctionDto.itemIds,
    });

    // Add selected items to auction
    if (auction.itemIds) {
      await this.auctionRepository.addItemsToAuction(
        auction.id,
        createAuctionDto.itemIds
      );
    }

    // Return auction with items included
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

  async getAuctionById(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.auctionRepository.getAuctionById(id);

    if (!auction) {
      throw new NotFoundException('Subasta no encontrada');
    }

    if (auction.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a esta subasta');
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
      // Remove existing auction items
      await this.auctionRepository.removeAllItemsFromAuction(id);

      // Add new selected items
      if (updateAuctionDto.selectedItems.length > 0) {
        await this.auctionRepository.addItemsToAuction(
          id,
          updateAuctionDto.selectedItems
        );
      }
    }

    // Return updated auction with items
    return this.auctionRepository.getAuctionById(id);
  }

  async deleteAuction(id: string, tenantId: string): Promise<void> {
    const auction = await this.getAuctionById(id, tenantId);

    // Validate that auction can be deleted (not started yet)
    if (auction.status === 'ACTIVA') {
      throw new BadRequestException('No se puede eliminar una subasta activa');
    }

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

    // Validation: Can only cancel PENDIENTE or ACTIVA auctions
    // Cannot cancel COMPLETADA, ELIMINADA, or already CANCELADA
    if (auction.status === 'COMPLETADA' || auction.status === 'ELIMINADA') {
      throw new BadRequestException(
        'No se puede cancelar una subasta finalizada o eliminada'
      );
    }
    if (auction.status === 'CANCELADA') {
      // idempotent: return current state
      return auction;
    }

    // Additional validation: Check if auction has active bids
    const bidCount = await this.prisma.bid.count({
      where: {
        auctionId: id,
      },
    });

    if (bidCount > 0 && auction.status === 'ACTIVA') {
      // Allow cancellation but log warning
      this.prisma.auditLog.create({
        data: {
          action: 'AUCTION_CANCELLED_WITH_BIDS',
          entityType: 'Auction',
          entityId: id,
          changes: { bidCount, previousStatus: auction.status, tenantId },
        },
      });
    }

    // Update status to CANCELADA
    const updated = await this.auctionRepository.updateAuctionStatus(
      id,
      'CANCELADA'
    );

    // Broadcast status change via WebSocket
    this.auctionsGateway.broadcastAuctionStatusChange(
      tenantId,
      id,
      'CANCELADA',
      updated
    );

    // Audit log (server-authoritative cancel)
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

    // Can only uncancel CANCELADA auctions
    if (auction.status !== 'CANCELADA') {
      throw new BadRequestException(
        'Solo se pueden descancelar subastas canceladas'
      );
    }

    // Check if auction should be PENDIENTE or ACTIVA based on current time
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    let newStatus: 'PENDIENTE' | 'ACTIVA' | 'COMPLETADA' = 'PENDIENTE';

    if (now >= startTime && now < endTime) {
      newStatus = 'ACTIVA';
    } else if (now >= endTime) {
      throw new BadRequestException(
        'No se puede descancelar una subasta cuya fecha de fin ya pasó'
      );
    }

    return this.auctionRepository.updateAuctionStatus(id, newStatus);
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
