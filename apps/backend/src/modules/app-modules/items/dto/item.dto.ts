import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalStatusEnum, ItemStateEnum } from '@prisma/client';

export class CreateItemDto {
  @ApiPropertyOptional({ description: 'Patente del vehículo' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  @IsOptional()
  @IsInt({ message: 'El año debe ser un número entero' })
  @Transform(({ value }) => Number(value))
  year?: number;

  @ApiPropertyOptional({ description: 'Versión del vehículo' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Kilometraje del vehículo' })
  @IsOptional()
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Transform(({ value }) => Number(value))
  kilometraje?: number;

  @ApiPropertyOptional({
    description: 'Estado legal del vehículo',
    enum: LegalStatusEnum,
  })
  @IsOptional()
  @IsEnum(LegalStatusEnum, { message: 'Estado legal inválido' })
  legal_status?: LegalStatusEnum;

  @ApiPropertyOptional({ description: 'Precio base del item' })
  @IsOptional()
  @IsNumber({}, { message: 'El precio base debe ser un número' })
  @IsPositive({ message: 'El precio base debe ser positivo' })
  @Transform(({ value }) => Number(value))
  basePrice?: number;

  @ApiPropertyOptional({ description: 'URLs de fotos separadas por comas' })
  @IsOptional()
  @IsString()
  photos?: string;

  @ApiPropertyOptional({
    description: 'URLs de documentos separadas por comas',
  })
  @IsOptional()
  @IsString()
  docs?: string;

  @ApiProperty({
    description: 'Estado del item',
    enum: ItemStateEnum,
    default: ItemStateEnum.DISPONIBLE,
  })
  @IsEnum(ItemStateEnum, { message: 'Estado inválido' })
  state: ItemStateEnum = ItemStateEnum.DISPONIBLE;
}

export class UpdateItemDto {
  @ApiPropertyOptional({
    description: 'Nombre del item',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ description: 'Descripción del item' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Placa del vehículo',
    minLength: 1,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La placa es requerida' })
  @MaxLength(20, { message: 'La placa no puede exceder 20 caracteres' })
  plate?: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  @IsOptional()
  @IsNumber({}, { message: 'El año debe ser un número' })
  @Transform(({ value }) => Number(value))
  year?: number;

  @ApiPropertyOptional({ description: 'Versión del vehículo' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Kilometraje del vehículo' })
  @IsOptional()
  @IsInt({ message: 'El kilometraje debe ser un número entero' })
  @Transform(({ value }) => Number(value))
  kilometraje?: number;

  @ApiPropertyOptional({
    description: 'Estado legal del vehículo',
    enum: LegalStatusEnum,
  })
  @IsOptional()
  @IsEnum(LegalStatusEnum, { message: 'Estado legal inválido' })
  legal_status?: LegalStatusEnum;

  @ApiPropertyOptional({ description: 'Color del vehículo' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Precio base del item' })
  @IsOptional()
  @IsNumber({}, { message: 'El precio base debe ser un número' })
  @IsPositive({ message: 'El precio base debe ser positivo' })
  @Transform(({ value }) => Number(value))
  basePrice?: number;

  @ApiPropertyOptional({ description: 'URLs de fotos separadas por comas' })
  @IsOptional()
  @IsString()
  photos?: string;

  @ApiPropertyOptional({
    description: 'URLs de documentos separadas por comas',
  })
  @IsOptional()
  @IsString()
  docs?: string;

  @ApiPropertyOptional({ description: 'Estado del item', enum: ItemStateEnum })
  @IsOptional()
  @IsEnum(ItemStateEnum, { message: 'Estado inválido' })
  state?: ItemStateEnum;
}

export class ItemStatsDto {
  @ApiProperty({ description: 'Total de items' })
  totalItems: number;

  @ApiProperty({ description: 'Items disponibles' })
  availableItems: number;

  @ApiProperty({ description: 'Items en subasta' })
  inAuctionItems: number;

  @ApiProperty({ description: 'Items vendidos' })
  soldItems: number;
}

export class ItemResponseDto {
  @ApiProperty({ description: 'ID del item' })
  id: string;

  @ApiProperty({ description: 'Nombre del item' })
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del item' })
  description?: string;

  @ApiProperty({ description: 'Placa del vehículo' })
  plate: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  year?: number;

  @ApiPropertyOptional({ description: 'Color del vehículo' })
  color?: string;

  @ApiPropertyOptional({ description: 'Precio base del item' })
  basePrice?: number;

  @ApiProperty({ description: 'Estado del item' })
  state: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}
