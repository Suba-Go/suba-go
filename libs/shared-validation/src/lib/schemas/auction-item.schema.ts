import { z } from 'zod';
import { baseSchema } from './base.schema';
// import { auctionSchema } from './auction.schema';
import { itemSchema } from './item.schema';
import { bidSchema } from './bid.schema';

export const auctionItemSchema = baseSchema
  .extend({
    startingBid: z.number().positive(),
    auctionId: z.uuid(),
    itemId: z.uuid(),
    // Relations
    // get auction() {
    //   return auctionSchema;
    // },
    get item() {
      return itemSchema.nullable();
    },
    get bids() {
      return z.array(bidSchema).nullable();
    },
  })
  .strict();

export type AuctionItemDto = z.infer<typeof auctionItemSchema>;
