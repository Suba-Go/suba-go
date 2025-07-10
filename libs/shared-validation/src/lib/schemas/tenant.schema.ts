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

export const tenantCreateSchema = tenantSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
  })
  .strict();

export type TenantDto = z.infer<typeof tenantSchema>;
export type TenantCreateDto = z.infer<typeof tenantCreateSchema>;
