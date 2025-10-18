import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { AuctionTypeEnum } from '../enums/auction';
import { baseSchema } from './base.schema';
import { AuctionStatusEnum } from '@prisma/client';

z.setErrorMap(errorMap);

export const auctionSchema = baseSchema
  .extend({
    public_id: z.string(),
    name: name,
    start: z.date(),
    end: z.date().nullable(),
    state: z.nativeEnum(AuctionStatusEnum).default(AuctionStatusEnum.ACTIVA),
    type: z.nativeEnum(AuctionTypeEnum).default(AuctionTypeEnum.REAL),
  })
  .strict();

export type AuctionDto = z.infer<typeof auctionSchema>;

// Schema for creating auctions with bid increment settings
// Note: Date/time validation happens in the component to allow same-day auctions with future times
export const auctionCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().optional(),
  startDate: z.date(),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Formato de hora inválido (HH:MM)'
    ),
  durationMinutes: z
    .number()
    .int('La duración debe ser un número entero')
    .min(15, 'La duración mínima es de 15 minutos')
    .max(1440, 'La duración máxima es de 24 horas')
    .default(30),
  bidIncrement: z
    .number()
    .positive('El incremento de puja debe ser positivo')
    .default(50000),
  selectedItems: z
    .array(z.string())
    .min(1, 'Debe seleccionar al menos un item'),
  type: z.nativeEnum(AuctionTypeEnum).default(AuctionTypeEnum.REAL),
});

export type AuctionCreateDto = z.infer<typeof auctionCreateSchema>;

// Schema for auction with full relations for display
export const auctionWithItemsSchema = auctionSchema.extend({
  items: z.array(
    z.object({
      id: z.string(),
      startingBid: z.number(),
      reservePrice: z.number().nullable(),
      item: z.object({
        id: z.string(),
        plate: z.string().nullable(),
        brand: z.string().nullable(),
        model: z.string().nullable(),
        year: z.number().nullable(),
        version: z.string().nullable(),
        photos: z.string().nullable(),
        kilometraje: z.number().nullable(),
        legal_status: z.string().nullable(),
        state: z.string(),
      }),
      bids: z.array(
        z.object({
          id: z.string(),
          offered_price: z.number(),
          bid_time: z.date(),
          user: z.object({
            id: z.string(),
            public_name: z.string().nullable(),
            name: z.string().nullable(),
            email: z.string(),
            phone: z.string().nullable(),
          }),
        })
      ),
    })
  ),
});

export type AuctionWithItemsDto = z.infer<typeof auctionWithItemsSchema>;
