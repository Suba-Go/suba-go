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
  ForbiddenException,
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
import { ItemsService } from './services/items.service';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemStatsDto,
  ItemResponseDto,
} from './dto/item.dto';

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

@ApiTags('items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Crear nuevo item' })
  @ApiResponse({
    status: 201,
    description: 'Item creado exitosamente',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear items' })
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @Body() createItemDto: CreateItemDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.itemsService.createItem(createItemDto, tenantId);
  }

  @Get('tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener items por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de items',
    type: [ItemResponseDto],
  })
  async getItemsByTenant(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a los items de este tenant');
    }

    return this.itemsService.getItemsByTenant(tenantId);
  }

  @Get('available/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener items disponibles por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de items disponibles',
    type: [ItemResponseDto],
  })
  async getAvailableItems(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a los items de este tenant');
    }

    return this.itemsService.getAvailableItems(tenantId);
  }

  @Get('stats/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Obtener estadísticas de items por tenant' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de items',
    type: ItemStatsDto,
  })
  async getItemStats(
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new ForbiddenException(
        'No tienes acceso a las estadísticas de este tenant'
      );
    }

    return this.itemsService.getItemStats(tenantId);
  }

  @Get('sold-to/:userId')
  @ApiOperation({ summary: 'Obtener items vendidos a un usuario específico' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de items vendidos al usuario',
    type: [ItemResponseDto],
  })
  async getItemsSoldToUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;

    // USER can only fetch their own sold items
    if (req.user.role === UserRolesEnum.USER && req.user.userId !== userId) {
      throw new ForbiddenException(
        'No tienes acceso a los items vendidos de otro usuario'
      );
    }
    return this.itemsService.getItemsSoldToUser(userId, tenantId);
  }

  @Get('by-state/:state/tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  @ApiOperation({ summary: 'Obtener items por estado y tenant' })
  @ApiParam({ name: 'state', description: 'Estado del item' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de items por estado',
    type: [ItemResponseDto],
  })
  async getItemsByState(
    @Param('state') state: string,
    @Param('tenantId') tenantId: string,
    @Request() req: AuthenticatedRequest
  ) {
    // Validate that user belongs to the tenant
    if (req.user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a los items de este tenant');
    }

    return this.itemsService.getItemsByState(state, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener item por ID' })
  @ApiParam({ name: 'id', description: 'ID del item' })
  @ApiResponse({
    status: 200,
    description: 'Detalles del item',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  async getItemById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.itemsService.getItemById(id, tenantId, {
      role: req.user.role,
      userId: req.user.userId,
    });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Actualizar item' })
  @ApiParam({ name: 'id', description: 'ID del item' })
  @ApiResponse({
    status: 200,
    description: 'Item actualizado exitosamente',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  async updateItem(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.itemsService.updateItem(id, updateItemDto, tenantId);
  }

  @Put(':id/state')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Actualizar estado del item' })
  @ApiParam({ name: 'id', description: 'ID del item' })
  @ApiQuery({ name: 'state', description: 'Nuevo estado del item' })
  @ApiResponse({
    status: 200,
    description: 'Estado del item actualizado',
    type: ItemResponseDto,
  })
  async updateItemState(
    @Param('id') id: string,
    @Query('state') state: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    return this.itemsService.updateItemState(id, state, tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  @ApiOperation({ summary: 'Eliminar item' })
  @ApiParam({ name: 'id', description: 'ID del item' })
  @ApiResponse({ status: 204, description: 'Item eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Item no puede ser eliminado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const tenantId = req.user.tenantId;
    await this.itemsService.deleteItem(id, tenantId);
  }
}
