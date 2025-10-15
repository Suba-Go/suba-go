import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

// Tenant no longer has a name field - company name is used as subdomain
export const tenantSchema = baseSchema.strict();

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
