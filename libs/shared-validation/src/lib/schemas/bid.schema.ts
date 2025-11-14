import { z } from 'zod';
import { baseSchema } from './base.schema';
// import { tenantSchema } from './tenant.schema';
// import { userSafeSchema } from './user.schema';
// import { auctionSchema } from './auction.schema';
// import { auctionItemSchema } from './auction-item.schema';

export const bidSchema = baseSchema
  .extend({
    requestId: z.uuid().nullable(),
    offered_price: z.number().positive(),
    bid_time: z.date(),
    tenantId: z.uuid(),
    userId: z.uuid(),
    auctionId: z.uuid(),
    auctionItemId: z.uuid(),
    // Relations
    // get tenant() {
    //   return tenantSchema.nullable();
    // },
    // get user() {
    //   return userSafeSchema.nullable();
    // },
    // get auction() {
    //   return auctionSchema;
    // },
    // get auctionItem() {
    //   return auctionItemSchema;
    // },
  })
  .strict();

export type BidDto = z.infer<typeof bidSchema>;

export const bidCreateSchema = z
  .object({
    auctionItemId: z.uuid(),
    offered_price: z.number().positive('El precio ofrecido debe ser positivo'),
  })
  .strict();

export const auctionBidSchema = bidSchema.extend({});

export type BidCreateDto = z.infer<typeof bidCreateSchema>;
