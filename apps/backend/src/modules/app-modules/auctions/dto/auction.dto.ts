import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  IsPositive,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Local enum definition to avoid import issues
enum AuctionTypeEnum {
  TEST = 'test',
  REAL = 'real',
}

export class CreateAuctionDto {
  @ApiProperty({
    description: 'Título de la subasta',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: 'El título es requerido' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title: string;

  @ApiPropertyOptional({ description: 'Descripción de la subasta' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Fecha y hora de inicio de la subasta' })
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ description: 'Fecha y hora de fin de la subasta' })
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ description: 'Incremento mínimo de puja', default: 50000 })
  @IsNumber({}, { message: 'El incremento de puja debe ser un número' })
  @IsPositive({ message: 'El incremento de puja debe ser positivo' })
  @Transform(({ value }) => Number(value))
  bidIncrement = 50000;

  @ApiProperty({
    description: 'IDs de los items seleccionados para la subasta',
    type: [String],
  })
  @IsArray({ message: 'Los items seleccionados deben ser un array' })
  @IsString({ each: true, message: 'Cada item debe ser un string válido' })
  selectedItems: string[];

  @ApiProperty({
    description: 'Tipo de subasta',
    enum: AuctionTypeEnum,
    default: AuctionTypeEnum.REAL,
  })
  @IsOptional()
  @IsEnum(AuctionTypeEnum, {
    message: 'El tipo de subasta debe ser test o real',
  })
  type?: AuctionTypeEnum = AuctionTypeEnum.REAL;
}

export class UpdateAuctionDto {
  @ApiPropertyOptional({
    description: 'Título de la subasta',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El título es requerido' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @ApiPropertyOptional({ description: 'Descripción de la subasta' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de inicio de la subasta' })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  startTime?: Date;

  @ApiPropertyOptional({ description: 'Fecha y hora de fin de la subasta' })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha inválido' })
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  endTime?: Date;

  @ApiPropertyOptional({ description: 'Incremento mínimo de puja' })
  @IsOptional()
  @IsNumber({}, { message: 'El incremento de puja debe ser un número' })
  @IsPositive({ message: 'El incremento de puja debe ser positivo' })
  @Transform(({ value }) => Number(value))
  bidIncrement?: number;

  @ApiPropertyOptional({
    description: 'IDs de los items seleccionados para la subasta',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Los items seleccionados deben ser un array' })
  @IsString({ each: true, message: 'Cada item debe ser un string válido' })
  selectedItems?: string[];

  @ApiPropertyOptional({
    description: 'Tipo de subasta',
    enum: AuctionTypeEnum,
  })
  @IsOptional()
  @IsEnum(AuctionTypeEnum, {
    message: 'El tipo de subasta debe ser test o real',
  })
  type?: AuctionTypeEnum;
}

export class AuctionStatsDto {
  @ApiProperty({ description: 'Total de subastas' })
  totalAuctions: number;

  @ApiProperty({ description: 'Subastas activas' })
  activeAuctions: number;

  @ApiProperty({ description: 'Total de participantes únicos' })
  totalParticipants: number;

  @ApiProperty({ description: 'Ingresos totales' })
  totalRevenue: number;
}

export class AuctionResponseDto {
  @ApiProperty({ description: 'ID de la subasta' })
  id: string;

  @ApiProperty({ description: 'Título de la subasta' })
  title: string;

  @ApiPropertyOptional({ description: 'Descripción de la subasta' })
  description?: string;

  @ApiProperty({ description: 'Fecha y hora de inicio' })
  startTime: Date;

  @ApiProperty({ description: 'Fecha y hora de fin' })
  endTime: Date;

  @ApiProperty({ description: 'Estado de la subasta' })
  status: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}
