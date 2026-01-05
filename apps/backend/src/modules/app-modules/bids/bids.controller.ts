/**
 * @file bids.controller.ts
 * @description Controller for bid-related endpoints
 * @author Suba&Go
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
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
import { BidRealtimeService } from './services/bid-realtime.service';
import { AuthenticatedRequest } from '../../../common/types/auth.types';

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidRealtimeService: BidRealtimeService) {}

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Obtener todas las pujas de una subasta' })
  @ApiParam({ name: 'auctionId', description: 'ID de la subasta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas de la subasta',
  })
  async getAuctionBids(
    @Param('auctionId') auctionId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.bidRealtimeService.getAuctionBids(auctionId, tenantId);
  }

  @Get('item/:auctionItemId')
  @ApiOperation({ summary: 'Obtener historial de pujas de un item' })
  @ApiParam({ name: 'auctionItemId', description: 'ID del item de subasta' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de pujas a retornar',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de pujas del item',
  })
  async getItemBidHistory(
    @Param('auctionItemId') auctionItemId: string,
    @Query('limit') limit: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.bidRealtimeService.getBidHistory(
      auctionItemId,
      tenantId,
      limitNum
    );
  }

  @Get('user/my-bids')
  @ApiOperation({ summary: 'Obtener las pujas del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pujas del usuario',
  })
  async getMyBids(@Request() req: AuthenticatedRequest) {
    //const userId = req.user.userId;
    //const tenantId = req.user.tenantId;
    // This would need a new method in the service
    // For now, we can use the existing getUserAuctionBids if we have an auctionId
    // Or create a new method to get all user bids across all auctions
    return { message: 'Endpoint to be implemented' };
  }
}
