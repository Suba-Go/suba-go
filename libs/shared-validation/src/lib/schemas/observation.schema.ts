import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const observationSchema = baseSchema
  .extend({
    title: name,
    description: z.string(),
  })
  .strict();

export type ObservationDto = z.infer<typeof observationSchema>;
