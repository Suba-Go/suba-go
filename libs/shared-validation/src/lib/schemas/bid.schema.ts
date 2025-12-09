import { z } from 'zod';
import { baseSchema } from './base.schema';
import { userSafeSchema } from './user.schema';

export const bidSchema = baseSchema
  .extend({
    requestId: z.uuid().nullable(),
    offered_price: z.number().positive(),
    bid_time: z.date(),
    tenantId: z.uuid(),
    userId: z.uuid(),
    auctionId: z.uuid(),
    auctionItemId: z.uuid(),
  })
  .strict();

export const bidWithUserSchema = bidSchema
  .extend({
    user: userSafeSchema,
  })
  .strict();

export const bidCreateSchema = z
  .object({
    auctionItemId: z.uuid(),
    offered_price: z.number().positive('El precio ofrecido debe ser positivo'),
  })
  .strict();

export type BidDto = z.infer<typeof bidSchema>;
export type BidWithUserDto = z.infer<typeof bidWithUserSchema>;
export type BidCreateDto = z.infer<typeof bidCreateSchema>;
