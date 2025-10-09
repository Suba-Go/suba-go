import { IsString, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({ description: 'ID del item de subasta' })
  @IsString()
  auctionItemId: string;

  @ApiProperty({ description: 'Precio ofertado', minimum: 1 })
  @IsNumber({}, { message: 'El precio ofertado debe ser un número' })
  @IsPositive({ message: 'El precio ofertado debe ser positivo' })
  @Min(1000, { message: 'El precio mínimo es $1,000' })
  @Transform(({ value }) => Number(value))
  offeredPrice: number;
}

export class UpdateBidDto {
  @ApiProperty({ description: 'Nuevo precio ofertado', minimum: 1 })
  @IsNumber({}, { message: 'El precio ofertado debe ser un número' })
  @IsPositive({ message: 'El precio ofertado debe ser positivo' })
  @Min(1000, { message: 'El precio mínimo es $1,000' })
  @Transform(({ value }) => Number(value))
  offeredPrice: number;
}

export class BidStatsDto {
  @ApiProperty({ description: 'Total de pujas realizadas' })
  totalBids: number;

  @ApiProperty({ description: 'Pujas activas' })
  activeBids: number;

  @ApiProperty({ description: 'Valor total de todas las pujas' })
  totalBidValue: number;

  @ApiProperty({ description: 'Valor promedio por puja' })
  averageBidValue: number;

  @ApiProperty({ description: 'Número de pujadores únicos' })
  uniqueBidders: number;
}

export class BidResponseDto {
  @ApiProperty({ description: 'ID de la puja' })
  id: string;

  @ApiProperty({ description: 'Precio ofertado' })
  offeredPrice: number;

  @ApiProperty({ description: 'Fecha y hora de la puja' })
  bidTime: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Información del usuario' })
  user: {
    id: string;
    email: string;
    name?: string;
    publicName?: string;
  };

  @ApiProperty({ description: 'Información del item de subasta' })
  auctionItem: {
    id: string;
    item: {
      id: string;
      name: string;
      plate?: string;
      brand?: string;
      model?: string;
      basePrice?: number;
    };
    auction: {
      id: string;
      title: string;
      status: string;
      startTime: Date;
      endTime: Date;
    };
  };
}

export class BidValidationDto {
  @ApiProperty({ description: 'Indica si la puja es válida' })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'Puja más alta actual' })
  currentHighestBid?: number;

  @ApiProperty({ description: 'Puja mínima requerida' })
  minimumBid: number;

  @ApiPropertyOptional({ description: 'Mensaje de error si la puja no es válida' })
  message?: string;
}

export class BidHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Número de pujas a retornar', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value))
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Página para paginación', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value))
  page?: number = 1;
}

export class WinningBidDto {
  @ApiProperty({ description: 'ID de la puja ganadora' })
  id: string;

  @ApiProperty({ description: 'Precio ganador' })
  offeredPrice: number;

  @ApiProperty({ description: 'Fecha de la puja ganadora' })
  bidTime: Date;

  @ApiProperty({ description: 'Información del ganador' })
  user: {
    id: string;
    email: string;
    name?: string;
    publicName?: string;
  };

  @ApiProperty({ description: 'Información del item ganado' })
  auctionItem: {
    id: string;
    item: {
      id: string;
      name: string;
      plate?: string;
      brand?: string;
      model?: string;
    };
  };
}

export class BidSummaryDto {
  @ApiProperty({ description: 'ID del item de subasta' })
  auctionItemId: string;

  @ApiProperty({ description: 'Nombre del item' })
  itemName: string;

  @ApiProperty({ description: 'Número total de pujas' })
  totalBids: number;

  @ApiProperty({ description: 'Puja más alta' })
  highestBid: number;

  @ApiProperty({ description: 'Puja más baja' })
  lowestBid: number;

  @ApiProperty({ description: 'Precio promedio de pujas' })
  averageBid: number;

  @ApiProperty({ description: 'Última puja realizada' })
  lastBidTime: Date;

  @ApiProperty({ description: 'Número de pujadores únicos' })
  uniqueBidders: number;
}
