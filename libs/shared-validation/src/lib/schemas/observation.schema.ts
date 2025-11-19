import { z } from 'zod';
import { name } from './main.schema';
import { baseSchema } from './base.schema';

export const observationSchema = baseSchema
  .extend({
    title: name,
    description: z.string(),
    tenantId: z.uuid(),
  })
  .strict();

export type ObservationDto = z.infer<typeof observationSchema>;
