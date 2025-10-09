import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ParticipantPrismaService } from './participant-prisma.service';
import {
  InviteParticipantDto,
  ParticipantStatsDto,
} from '../dto/participant.dto';
import type { User, Bid } from '@prisma/client';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantRepository: ParticipantPrismaService
  ) {}

  async getParticipantsByAuction(
    auctionId: string,
    tenantId: string
  ): Promise<User[]> {
    const participants =
      await this.participantRepository.findParticipantsByAuction(auctionId);

    // Validate that all participants belong to the tenant
    const validParticipants = participants.filter(
      (p) => p.tenantId === tenantId
    );

    return validParticipants;
  }

  async getParticipantsByTenant(tenantId: string): Promise<User[]> {
    return this.participantRepository.findParticipantsByTenant(tenantId);
  }

  async getActiveParticipants(tenantId: string): Promise<User[]> {
    return this.participantRepository.findActiveParticipants(tenantId);
  }

  async getParticipantById(id: string, tenantId: string): Promise<User> {
    const participant = await this.participantRepository.findParticipantById(
      id,
      tenantId
    );

    if (!participant) {
      throw new NotFoundException('Participante no encontrado');
    }

    if (participant.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este participante');
    }

    return participant;
  }

  async getParticipantBidHistory(
    userId: string,
    tenantId: string
  ): Promise<Bid[]> {
    // Validate participant exists and belongs to tenant
    await this.getParticipantById(userId, tenantId);

    return this.participantRepository.getParticipantBidHistory(
      userId,
      tenantId
    );
  }

  async getParticipantStats(tenantId: string): Promise<ParticipantStatsDto> {
    const stats = await this.participantRepository.getParticipantStats(
      tenantId
    );

    return {
      totalParticipants: stats.totalParticipants,
      activeParticipants: stats.activeParticipants,
      totalBids: stats.totalBids,
      averageBidsPerParticipant: stats.averageBidsPerParticipant,
    };
  }

  async inviteParticipant(
    inviteDto: InviteParticipantDto,
    tenantId: string
  ): Promise<User> {
    try {
      const participant = await this.participantRepository.inviteParticipant(
        inviteDto.email,
        tenantId
      );

      // TODO: Send invitation email
      // await this.emailService.sendInvitation(inviteDto.email, tenantId);

      return participant;
    } catch (error) {
      throw new BadRequestException(
        'Error al invitar participante: ' + error.message
      );
    }
  }

  async removeParticipant(userId: string, tenantId: string): Promise<void> {
    // Validate participant exists and belongs to tenant
    await this.getParticipantById(userId, tenantId);

    try {
      await this.participantRepository.removeParticipant(userId, tenantId);
    } catch (error) {
      throw new BadRequestException(
        'Error al eliminar participante: ' + error.message
      );
    }
  }

  async validateParticipantAccess(
    userId: string,
    auctionId: string,
    tenantId: string
  ): Promise<boolean> {
    const participant = await this.getParticipantById(userId, tenantId);

    // Check if participant is active (not deleted)
    if (participant.isDeleted) {
      throw new ForbiddenException('Participante inactivo');
    }

    // Additional validation logic can be added here
    // For example, checking if participant is specifically invited to this auction

    return true;
  }

  async getParticipantAuctionSummary(
    userId: string,
    tenantId: string
  ): Promise<{
    totalAuctions: number;
    activeAuctions: number;
    wonAuctions: number;
    totalBids: number;
    totalSpent: number;
  }> {
    await this.getParticipantById(userId, tenantId);
    const bidHistory = await this.getParticipantBidHistory(userId, tenantId);

    const auctionIds = new Set(bidHistory.map((bid) => bid.auctionId));
    // Note: We would need to include auction data in the query to filter by status
    // For now, we'll use all auction IDs
    const activeAuctionIds = new Set(bidHistory.map((bid) => bid.auctionId));

    // Calculate won auctions (simplified - would need more complex logic for actual winners)
    const wonAuctions = 0; // TODO: Implement proper winner calculation

    // Calculate total spent (sum of winning bids)
    const totalSpent = 0; // TODO: Implement based on won auctions

    return {
      totalAuctions: auctionIds.size,
      activeAuctions: activeAuctionIds.size,
      wonAuctions,
      totalBids: bidHistory.length,
      totalSpent,
    };
  }
}
