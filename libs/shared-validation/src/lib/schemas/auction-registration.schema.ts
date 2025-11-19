import { z } from 'zod';
import { auctionSchema } from './auction.schema';
// import { userSchema } from './user.schema';
// import { auctionSchema } from './auction.schema';

export const auctionRegistrationSchema = z
  .object({
    id: z.uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    userId: z.uuid(),
    auctionId: z.uuid(),
  })
  .strict();

export const auctionRegistrationWithAuctionSchema =
  auctionRegistrationSchema.extend({
    auction: auctionSchema,
  });

export type AuctionRegistrationDto = z.infer<typeof auctionRegistrationSchema>;
export type AuctionRegistrationWithAuctionDto = z.infer<
  typeof auctionRegistrationWithAuctionSchema
>;
