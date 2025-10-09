import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParticipantsService } from './services/participants.service';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import {
  InviteParticipantDto,
  ParticipantStatsDto,
  ParticipantResponseDto,
  ParticipantBidHistoryDto,
  ParticipantSummaryDto,
  BulkInviteParticipantsDto,
} from './dto/participant.dto';

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@ApiTags('participants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post('invite')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Invitar nuevo participante' })
  @ApiResponse({
    status: 201,
    description: 'Participante invitado exitosamente',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para invitar participantes',
  })
  @HttpCode(HttpStatus.CREATED)
  async inviteParticipant(
    @Body() inviteDto: InviteParticipantDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.participantsService.inviteParticipant(inviteDto, tenantId);
  }

  @Post('bulk-invite')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Invitar múltiples participantes' })
  @ApiResponse({
    status: 201,
    description: 'Participantes invitados exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async bulkInviteParticipants(
    @Body() bulkInviteDto: BulkInviteParticipantsDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    const results = [];

    for (const email of bulkInviteDto.emails) {
      try {
        const participant = await this.participantsService.inviteParticipant(
          { email, message: bulkInviteDto.message },
          tenantId
        );
        results.push({ email, success: true, participant });
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    return { results };
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener participantes por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes',
    type: [ParticipantResponseDto],
  })
  async getParticipantsByTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a los participantes de este tenant');
    }

    return this.participantsService.getParticipantsByTenant(tenantId);
  }

  @Get('active/tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener participantes activos por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes activos',
    type: [ParticipantResponseDto],
  })
  async getActiveParticipants(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a los participantes de este tenant');
    }

    return this.participantsService.getActiveParticipants(tenantId);
  }

  @Get('auction/:auctionId/tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener participantes de una subasta específica' })
  @ApiParam({ name: 'auctionId', description: 'ID de la subasta' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes de la subasta',
    type: [ParticipantResponseDto],
  })
  async getParticipantsByAuction(
    @Param('auctionId') auctionId: string,
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a los participantes de este tenant');
    }

    return this.participantsService.getParticipantsByAuction(
      auctionId,
      tenantId
    );
  }

  @Get('stats/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener estadísticas de participantes por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de participantes',
    type: ParticipantStatsDto,
  })
  async getParticipantStats(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a las estadísticas de este tenant');
    }

    return this.participantsService.getParticipantStats(tenantId);
  }

  @Get(':id/bid-history')
  @ApiOperation({ summary: 'Obtener historial de ofertas de un participante' })
  @ApiParam({ name: 'id', description: 'ID del participante' })
  @ApiResponse({
    status: 200,
    description: 'Historial de ofertas',
    type: [ParticipantBidHistoryDto],
  })
  async getParticipantBidHistory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.participantsService.getParticipantBidHistory(id, tenantId);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Obtener resumen de actividad de un participante' })
  @ApiParam({ name: 'id', description: 'ID del participante' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de actividad',
    type: ParticipantSummaryDto,
  })
  async getParticipantSummary(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.participantsService.getParticipantAuctionSummary(id, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener participante por ID' })
  @ApiParam({ name: 'id', description: 'ID del participante' })
  @ApiResponse({
    status: 200,
    description: 'Detalles del participante',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Participante no encontrado' })
  async getParticipantById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.participantsService.getParticipantById(id, tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Eliminar participante' })
  @ApiParam({ name: 'id', description: 'ID del participante' })
  @ApiResponse({
    status: 204,
    description: 'Participante eliminado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Participante no puede ser eliminado',
  })
  @ApiResponse({ status: 404, description: 'Participante no encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeParticipant(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    await this.participantsService.removeParticipant(id, tenantId);
  }
}
