import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { AuctionItemStateEnum } from '../enums/auction-item';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const auctionItemSchema = baseSchema
  .extend({
    name: name,
    state: z
      .nativeEnum(AuctionItemStateEnum)
      .default(AuctionItemStateEnum.DISPONIBLE),
    start_price: z.number().positive(),
    actual_price: z.number().positive(),
    selled_price: z.number().positive().nullable().optional(),
    selled_date: z.date().nullable().optional(),
  })
  .strict();

export type AuctionItemDto = z.infer<typeof auctionItemSchema>;
