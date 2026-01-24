import { z } from 'zod';
import { baseSchema } from './base.schema';

// Base schema without relations to avoid circular dependencies
export const tenantSchema = baseSchema
  .extend({
    // ADMIN can block a tenant (users should be denied access when blocked)
    isBlocked: z.boolean().optional(),
  })
  .strict();

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
