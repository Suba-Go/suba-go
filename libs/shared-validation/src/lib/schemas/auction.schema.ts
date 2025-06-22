import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { AuctionStateEnum, AuctionTypeEnum } from '../enums/auction';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const auctionSchema = baseSchema
  .extend({
    public_id: z.string(),
    name: name,
    start: z.date(),
    end: z.date().nullable(),
    state: z.nativeEnum(AuctionStateEnum).default(AuctionStateEnum.ACTIVE),
    type: z.nativeEnum(AuctionTypeEnum).default(AuctionTypeEnum.REAL),
  })
  .strict();

export type AuctionDto = z.infer<typeof auctionSchema>;
