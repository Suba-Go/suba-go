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
  @ApiProperty({
    description: 'Patente del vehículo',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La patente debe tener exactamente 6 caracteres' })
  @MaxLength(6, { message: 'La patente debe tener exactamente 6 caracteres' })
  plate: string;

  @ApiProperty({ description: 'Marca del vehículo' })
  @IsString()
  @MinLength(1, { message: 'La marca es requerida' })
  brand: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Año del vehículo',
    minLength: 4,
    maxLength: 4,
  })
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

  @ApiProperty({ description: 'Precio base del item' })
  @IsNumber({}, { message: 'El precio base debe ser un número' })
  @IsPositive({ message: 'El precio base debe ser positivo' })
  @Transform(({ value }) => Number(value))
  basePrice: number;

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
    description: 'Placa del vehículo',
    minLength: 6,
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La placa es requerida' })
  @MaxLength(6, { message: 'La placa no puede exceder 6 caracteres' })
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

  @ApiProperty({ description: 'Placa del vehículo' })
  plate: string;

  @ApiPropertyOptional({ description: 'Marca del vehículo' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del vehículo' })
  model?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  year?: number;

  @ApiPropertyOptional({ description: 'Precio base del item' })
  basePrice?: number;

  @ApiProperty({ description: 'Estado del item' })
  state: string;

  @ApiPropertyOptional({ description: 'URLs de fotos separadas por comas' })
  photos?: string;

  @ApiPropertyOptional({
    description: 'URLs de documentos separadas por comas',
  })
  docs?: string;

  @ApiPropertyOptional({ description: 'Versión del vehículo' })
  version?: string;

  @ApiPropertyOptional({ description: 'Kilometraje del vehículo' })
  kilometraje?: number;

  @ApiPropertyOptional({
    description: 'Estado legal del vehículo',
    enum: LegalStatusEnum,
  })
  legal_status?: LegalStatusEnum;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}
