import {
  Controller,
  Get,
  Post,
  Put,
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
import { AuctionsService } from './services/auctions.service';
import {
  CreateAuctionDto,
  UpdateAuctionDto,
  AuctionStatsDto,
  AuctionResponseDto,
} from './dto/auction.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@ApiTags('auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Crear nueva subasta' })
  @ApiResponse({
    status: 201,
    description: 'Subasta creada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear subastas' })
  @HttpCode(HttpStatus.CREATED)
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.createAuction(createAuctionDto, tenantId);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener subastas por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subastas',
    type: [AuctionResponseDto],
  })
  async getAuctionsByTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a las subastas de este tenant');
    }

    return this.auctionsService.getAuctionsByTenant(tenantId);
  }

  @Get('stats/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener estadísticas de subastas por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de subastas',
    type: AuctionStatsDto,
  })
  async getAuctionStats(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a las estadísticas de este tenant');
    }

    return this.auctionsService.getAuctionStats(tenantId);
  }

  @Get('active/tenant/:tenantId')
  @ApiOperation({ summary: 'Obtener subastas activas por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subastas activas',
    type: [AuctionResponseDto],
  })
  async getActiveAuctions(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a las subastas de este tenant');
    }

    return this.auctionsService.getActiveAuctions(tenantId);
  }

  @Get('my-registrations')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.USER, UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener mis registros de subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de subasta del usuario actual',
  })
  async getMyAuctionRegistrations(@Request() req: AuthenticatedRequest) {
    // Get registrations for the authenticated user
    return this.auctionsService.getUserAuctionRegistrations(req.user.userId);
  }

  @Get('user/:userId/registrations')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  @ApiOperation({
    summary:
      'Obtener registros de subasta de un usuario específico (solo managers)',
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de subasta',
  })
  async getUserAuctionRegistrations(@Param('userId') userId: string) {
    // Only managers and admins can see other users' registrations
    return this.auctionsService.getUserAuctionRegistrations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener subasta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la subasta',
    type: AuctionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subasta no encontrada' })
  async getAuctionById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.getAuctionById(id, tenantId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Actualizar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Subasta actualizada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o subasta no puede ser modificada',
  })
  @ApiResponse({ status: 404, description: 'Subasta no encontrada' })
  async updateAuction(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.updateAuction(id, updateAuctionDto, tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Eliminar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({ status: 204, description: 'Subasta eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'Subasta no puede ser eliminada' })
  @ApiResponse({ status: 404, description: 'Subasta no encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAuction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    await this.auctionsService.deleteAuction(id, tenantId);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Iniciar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Subasta iniciada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Subasta no puede ser iniciada' })
  async startAuction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.startAuction(id, tenantId);
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Cerrar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Subasta cerrada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Subasta no puede ser cerrada' })
  async closeAuction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.closeAuction(id, tenantId);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Cancelar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Subasta cancelada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Subasta no puede ser cancelada' })
  async cancelAuction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.cancelAuction(id, tenantId);
  }

  @Post(':id/uncancel')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Descancelar subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Subasta descancelada exitosamente',
    type: AuctionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Subasta no puede ser descancelada',
  })
  async uncancelAuction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.uncancelAuction(id, tenantId);
  }

  @Post(':id/register')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Registrar usuario en subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Error al registrar usuario' })
  async registerUserToAuction(
    @Param('id') auctionId: string,
    @Body() body: { userId: string },
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.registerUserToAuction(
      auctionId,
      body.userId,
      tenantId
    );
  }

  @Delete(':id/register/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Desregistrar usuario de subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario desregistrado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Error al desregistrar usuario' })
  async unregisterUserFromAuction(
    @Param('id') auctionId: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.unregisterUserFromAuction(
      auctionId,
      userId,
      tenantId
    );
  }

  @Get(':id/participants')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener participantes registrados en subasta' })
  @ApiParam({ name: 'id', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes registrados',
  })
  async getAuctionParticipants(
    @Param('id') auctionId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionsService.getAuctionParticipants(auctionId, tenantId);
  }
}
