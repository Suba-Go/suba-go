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
