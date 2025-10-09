import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BidsService } from './services/bids.service';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import {
  CreateBidDto,
  UpdateBidDto,
  BidStatsDto,
  BidResponseDto,
  BidHistoryQueryDto,
  WinningBidDto,
} from './dto/bid.dto';

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva puja' })
  @ApiResponse({
    status: 201,
    description: 'Puja creada exitosamente',
    type: BidResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o puja no válida' })
  @ApiResponse({ status: 403, description: 'Sin permisos para pujar' })
  @HttpCode(HttpStatus.CREATED)
  async createBid(
    @Body() createBidDto: CreateBidDto,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.bidsService.createBid(createBidDto, userId, tenantId);
  }

  @Get('auction-item/:auctionItemId')
  @ApiOperation({ summary: 'Obtener pujas por item de subasta' })
  @ApiParam({ name: 'auctionItemId', description: 'ID del item de subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas del item',
    type: [BidResponseDto],
  })
  async getBidsByAuctionItem(
    @Param('auctionItemId') auctionItemId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidsService.getBidsByAuctionItem(auctionItemId, tenantId);
  }

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Obtener todas las pujas de una subasta' })
  @ApiParam({ name: 'auctionId', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas de la subasta',
    type: [BidResponseDto],
  })
  async getBidsByAuction(
    @Param('auctionId') auctionId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidsService.getBidsByAuction(auctionId, tenantId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener pujas de un usuario específico' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas del usuario',
    type: [BidResponseDto],
  })
  async getBidsByUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;

    // Users can only see their own bids, auction managers can see any user's bids
    if (req.user.role !== 'AUCTION_MANAGER' && req.user.userId !== userId) {
      throw new Error('No tienes permisos para ver las pujas de otro usuario');
    }

    return this.bidsService.getBidsByUser(userId, tenantId);
  }

  @Get('my-bids')
  @ApiOperation({ summary: 'Obtener mis pujas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas del usuario actual',
    type: [BidResponseDto],
  })
  async getMyBids(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.bidsService.getBidsByUser(userId, tenantId);
  }

  @Get('highest/:auctionItemId')
  @ApiOperation({ summary: 'Obtener la puja más alta para un item' })
  @ApiParam({ name: 'auctionItemId', description: 'ID del item de subasta' })
  @ApiResponse({
    status: 200,
    description: 'Puja más alta',
    type: BidResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No hay pujas para este item' })
  async getHighestBidForItem(
    @Param('auctionItemId') auctionItemId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidsService.getHighestBidForItem(auctionItemId, tenantId);
  }

  @Get('minimum-amount/:auctionItemId')
  @ApiOperation({ summary: 'Obtener el monto mínimo para pujar en un item' })
  @ApiParam({ name: 'auctionItemId', description: 'ID del item de subasta' })
  @ApiResponse({ status: 200, description: 'Monto mínimo requerido' })
  async getMinimumBidAmount(@Param('auctionItemId') auctionItemId: string) {
    const minimumAmount = await this.bidsService.getMinimumBidAmount(
      auctionItemId
    );
    return { minimumAmount };
  }

  @Get('history/:auctionItemId')
  @ApiOperation({ summary: 'Obtener historial de pujas para un item' })
  @ApiParam({ name: 'auctionItemId', description: 'ID del item de subasta' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de pujas a retornar',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de pujas',
    type: [BidResponseDto],
  })
  async getBidHistory(
    @Param('auctionItemId') auctionItemId: string,
    @Query() query: BidHistoryQueryDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidsService.getBidHistory(auctionItemId, tenantId, query.limit);
  }

  @Get('winning/:auctionId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener pujas ganadoras de una subasta' })
  @ApiParam({ name: 'auctionId', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas ganadoras',
    type: [WinningBidDto],
  })
  async getWinningBids(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('auctionId') _auctionId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Request() _req: AuthenticatedRequest
  ) {
    // TODO: Implement winning bids logic with proper validation
    return this.bidsService.getWinningBids();
  }

  @Get('stats/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener estadísticas de pujas por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de pujas',
    type: BidStatsDto,
  })
  async getBidStats(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new Error('No tienes acceso a las estadísticas de este tenant');
    }

    return this.bidsService.getBidStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener puja por ID' })
  @ApiParam({ name: 'id', description: 'ID de la puja' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la puja',
    type: BidResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Puja no encontrada' })
  async getBidById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidsService.getBidById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar puja' })
  @ApiParam({ name: 'id', description: 'ID de la puja' })
  @ApiResponse({
    status: 200,
    description: 'Puja actualizada exitosamente',
    type: BidResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para actualizar esta puja',
  })
  @ApiResponse({ status: 404, description: 'Puja no encontrada' })
  async updateBid(
    @Param('id') id: string,
    @Body() updateBidDto: UpdateBidDto,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.bidsService.updateBid(
      id,
      updateBidDto.offeredPrice,
      userId,
      tenantId
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar puja' })
  @ApiParam({ name: 'id', description: 'ID de la puja' })
  @ApiResponse({ status: 204, description: 'Puja eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'Puja no puede ser eliminada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para eliminar esta puja',
  })
  @ApiResponse({ status: 404, description: 'Puja no encontrada' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBid(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    await this.bidsService.deleteBid(id, userId, tenantId);
  }
}
