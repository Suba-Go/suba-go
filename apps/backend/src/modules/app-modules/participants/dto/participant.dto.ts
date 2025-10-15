import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuctionStatusEnum } from '@prisma/client';

export class InviteParticipantDto {
  @ApiProperty({ description: 'Email del participante a invitar' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiPropertyOptional({ description: 'Nombre del participante' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Mensaje personalizado de invitación' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class ParticipantStatsDto {
  @ApiProperty({ description: 'Total de participantes' })
  totalParticipants: number;

  @ApiProperty({ description: 'Participantes activos' })
  activeParticipants: number;

  @ApiProperty({ description: 'Total de ofertas realizadas' })
  totalBids: number;

  @ApiProperty({ description: 'Promedio de ofertas por participante' })
  averageBidsPerParticipant: number;
}

export class ParticipantResponseDto {
  @ApiProperty({ description: 'ID del participante' })
  id: string;

  @ApiProperty({ description: 'Email del participante' })
  email: string;

  @ApiPropertyOptional({ description: 'Nombre del participante' })
  name?: string;

  @ApiPropertyOptional({ description: 'Teléfono del participante' })
  phone?: string;

  @ApiProperty({ description: 'Estado activo del participante' })
  isDeleted: boolean;

  @ApiProperty({ description: 'Rol del participante' })
  role: string;

  @ApiProperty({ description: 'Fecha de registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class ParticipantBidHistoryDto {
  @ApiProperty({ description: 'ID de la oferta' })
  id: string;

  @ApiProperty({ description: 'Monto ofertado' })
  offeredPrice: number;

  @ApiProperty({ description: 'Fecha de la oferta' })
  bidTime: Date;

  @ApiProperty({ description: 'Información del item' })
  auctionItem: {
    id: string;
    item: {
      id: string;
      name: string;
      plate?: string;
      brand?: string;
      model?: string;
    };
    auction: {
      id: string;
      title: string;
      status: AuctionStatusEnum;
      startTime: Date;
      endTime: Date;
    };
  };
}

export class ParticipantSummaryDto {
  @ApiProperty({ description: 'Total de subastas participadas' })
  totalAuctions: number;

  @ApiProperty({ description: 'Subastas activas' })
  activeAuctions: number;

  @ApiProperty({ description: 'Subastas ganadas' })
  wonAuctions: number;

  @ApiProperty({ description: 'Total de ofertas realizadas' })
  totalBids: number;

  @ApiProperty({ description: 'Total gastado en subastas ganadas' })
  totalSpent: number;
}

export class BulkInviteParticipantsDto {
  @ApiProperty({ description: 'Lista de emails a invitar', type: [String] })
  @IsEmail({}, { each: true, message: 'Todos los emails deben ser válidos' })
  emails: string[];

  @ApiPropertyOptional({
    description: 'Mensaje personalizado para todas las invitaciones',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class ParticipantFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por participantes con ofertas activas',
  })
  @IsOptional()
  @IsBoolean()
  hasActiveBids?: boolean;

  @ApiPropertyOptional({ description: 'Buscar por email o nombre' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Número de página' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
