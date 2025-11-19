import { z } from 'zod';
import { baseSchema } from './base.schema';

// Base schema without relations to avoid circular dependencies
export const tenantSchema = baseSchema.strict();

export const tenantCreateSchema = tenantSchema
  .omit({
    id: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .strict();

export type TenantDto = z.infer<typeof tenantSchema>;
export type TenantCreateDto = z.infer<typeof tenantCreateSchema>;
