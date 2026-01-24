import { z } from 'zod';
import { baseSchema } from './base.schema';
// import { auctionSchema } from './auction.schema';
import { itemWithSoldToUserSchema } from './item.schema';
import { bidWithUserSchema } from './bid.schema';

export const auctionItemSchema = baseSchema
  .extend({
    startingBid: z.number().positive(),
    auctionId: z.uuid(),
    itemId: z.uuid(),
    // Independent item timer (nullable for backwards compatibility)
    startTime: z.date().nullable().optional(),
    endTime: z.date().nullable().optional(),
  })
  .strict();

export const auctionItemWithItmeAndBidsSchema = baseSchema
  .extend({
    startingBid: z.number().positive(),
    auctionId: z.uuid(),
    itemId: z.uuid(),
    // Independent item timer (nullable for backwards compatibility)
    startTime: z.date().nullable().optional(),
    endTime: z.date().nullable().optional(),
    get item() {
      return itemWithSoldToUserSchema.nullable();
    },
    get bids() {
      return z.array(bidWithUserSchema).nullable();
    },
  })
  .strict();

export type AuctionItemDto = z.infer<typeof auctionItemSchema>;
export type AuctionItemWithItmeAndBidsDto = z.infer<
  typeof auctionItemWithItmeAndBidsSchema
>;
