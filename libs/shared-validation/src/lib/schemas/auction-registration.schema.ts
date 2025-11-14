import { z } from 'zod';
// import { userSchema } from './user.schema';
// import { auctionSchema } from './auction.schema';

export const auctionRegistrationSchema = z
  .object({
    id: z.uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    userId: z.uuid(),
    auctionId: z.uuid(),
    // Relations
    // get user() {
    //   return userSchema.nullable();
    // },
    // get auction() {
    //   return auctionSchema.nullable();
    // },
  })
  .strict();

export type AuctionRegistrationDto = z.infer<typeof auctionRegistrationSchema>;
