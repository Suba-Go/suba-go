import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuctionItemsService } from './services/auction-items.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

@ApiTags('auction-items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auction-items')
export class AuctionItemsController {
  constructor(private readonly auctionItemsService: AuctionItemsService) {}

  @Get('auction/:auctionId')
  @ApiOperation({ summary: 'Obtener items de una subasta por ID de subasta' })
  @ApiParam({ name: 'auctionId', description: 'ID de la subasta' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de items de la subasta',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subasta no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Sin acceso a esta subasta',
  })
  async getAuctionItemsByAuctionId(
    @Param('auctionId') auctionId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionItemsService.getAuctionItemsByAuctionId(
      auctionId,
      tenantId,
      {
        userId: req.user.userId,
        role: req.user.role,
      }
    );
  }

  // TODO typar respuesta
  @Get(':id')
  @ApiOperation({ summary: 'Obtener item de subasta por ID' })
  @ApiParam({ name: 'id', description: 'ID del auction item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles del item de subasta',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item no encontrado',
  })
  async getAuctionItemById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.auctionItemsService.getAuctionItemById(id, tenantId, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }
}
