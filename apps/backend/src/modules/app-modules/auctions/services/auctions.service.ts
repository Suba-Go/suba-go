import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuctionPrismaService } from './auction-prisma.service';
import {
  CreateAuctionDto,
  UpdateAuctionDto,
  AuctionStatsDto,
} from '../dto/auction.dto';
import type { Auction } from '@prisma/client';
import { AuctionTypeEnum } from '@prisma/client';

@Injectable()
export class AuctionsService {
  constructor(private readonly auctionRepository: AuctionPrismaService) {}

  async createAuction(
    createAuctionDto: CreateAuctionDto,
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
    let auctionType: AuctionTypeEnum = AuctionTypeEnum.REAL;
    if (createAuctionDto.type === 'test') {
      auctionType = AuctionTypeEnum.TEST;
    } else if (createAuctionDto.type === 'real') {
      auctionType = AuctionTypeEnum.REAL;
    }

    const auction = await this.auctionRepository.createAuction({
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startTime: createAuctionDto.startTime,
      endTime: createAuctionDto.endTime,
      tenantId,
      type: auctionType,
    });

    // Add selected items to auction
    if (
      createAuctionDto.selectedItems &&
      createAuctionDto.selectedItems.length > 0
    ) {
      await this.auctionRepository.addItemsToAuction(
        auction.id,
        createAuctionDto.selectedItems
      );
    }

    // Return auction with items included
    return this.auctionRepository.getAuctionById(auction.id);
  }

  async getAuctionsByTenant(tenantId: string): Promise<Auction[]> {
    return this.auctionRepository.getAuctionsByTenant(tenantId);
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

    // Validate that auction can be updated (not started yet)
    if (
      existingAuction.status === 'ACTIVE' ||
      existingAuction.status === 'CLOSED'
    ) {
      throw new BadRequestException(
        'No se puede modificar una subasta activa o cerrada'
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
    let auctionType: AuctionTypeEnum | undefined;
    if (updateAuctionDto.type) {
      if (updateAuctionDto.type === 'test') {
        auctionType = AuctionTypeEnum.TEST;
      } else if (updateAuctionDto.type === 'real') {
        auctionType = AuctionTypeEnum.REAL;
      }
    }

    // Update auction basic data
    await this.auctionRepository.updateAuction(id, {
      title: updateAuctionDto.title,
      description: updateAuctionDto.description,
      startTime: updateAuctionDto.startTime,
      endTime: updateAuctionDto.endTime,
      type: auctionType,
    });

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
    if (auction.status === 'ACTIVE') {
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

    if (auction.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo se pueden iniciar subastas pendientes'
      );
    }

    if (new Date() < auction.startTime) {
      throw new BadRequestException(
        'La subasta no puede iniciarse antes de su fecha programada'
      );
    }

    return this.auctionRepository.updateAuctionStatus(id, 'ACTIVE');
  }

  async closeAuction(id: string, tenantId: string): Promise<Auction> {
    const auction = await this.getAuctionById(id, tenantId);

    if (auction.status !== 'ACTIVE') {
      throw new BadRequestException('Solo se pueden cerrar subastas activas');
    }

    return this.auctionRepository.closeAuction(id);
  }
}
