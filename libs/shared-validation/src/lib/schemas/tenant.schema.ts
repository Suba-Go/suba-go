import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const tenantSchema = baseSchema
  .extend({
    name: name,
    domain: z.string().url(),
  })
  .strict();

export type TenantDto = z.infer<typeof tenantSchema>;
