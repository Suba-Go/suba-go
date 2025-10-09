import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const bidSchema = baseSchema
  .extend({
    offered_price: z.number().positive(),
    bid_time: z.date(),
  })
  .strict();

export type BidDto = z.infer<typeof bidSchema>;

// Schema for creating new bids
export const bidCreateSchema = z.object({
  auctionItemId: z.string().min(1, 'ID del item de subasta es requerido'),
  offeredPrice: z.number().positive('El precio ofrecido debe ser positivo'),
});

export type BidCreateDto = z.infer<typeof bidCreateSchema>;

// Schema for bid with user information for display
export const bidWithUserSchema = bidSchema.extend({
  user: z.object({
    id: z.string(),
    public_name: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string(),
    phone: z.string().nullable(),
  }),
});

export type BidWithUserDto = z.infer<typeof bidWithUserSchema>;
