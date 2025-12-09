import { z } from 'zod';
import { name } from './main.schema';
import { baseSchema } from './base.schema';
import { tenantSchema } from './tenant.schema';

export const companySchema = baseSchema
  .extend({
<<<<<<< HEAD
    name: name,
    nameLowercase: z.string(), // Lowercase version for case-insensitive subdomain lookup
    subtitle: z.string().nullable().optional(),
=======
    name,
    nameLowercase: z.string(),
>>>>>>> development
    logo: z.string().nullable().optional(),
    background_logo_enabled: z.boolean().optional().default(false),
    principal_color: z.string().nullable().optional(),
    principal_color2: z.string().nullable().optional(),
    secondary_color: z.string().nullable().optional(),
    secondary_color2: z.string().nullable().optional(),
    secondary_color3: z.string().nullable().optional(),
<<<<<<< HEAD
    rut: z.string().nullable().optional(),
=======
    tenantId: z.uuid().nullable(),
>>>>>>> development
  })
  .strict();

export const companyWithTenantSchema = companySchema.extend({
  get tenant() {
    return tenantSchema.nullable();
  },
});

export const companyCompactCreateSchema = companySchema.omit({
  id: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  nameLowercase: true,
  logo: true,
  principal_color2: true,
  secondary_color: true,
  secondary_color2: true,
  secondary_color3: true,
  tenantId: true,
});

export const companyCreateSchema = companySchema
  .omit({
    id: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    logo: true,
    principal_color2: true,
    secondary_color: true,
    secondary_color2: true,
    secondary_color3: true,
    tenantId: true,
  })
  .strict();

export type CompanyDto = z.infer<typeof companySchema>;
export type CompanyWithTenantDto = z.infer<typeof companyWithTenantSchema>;
export type CompanyCreateCompactDto = z.infer<
  typeof companyCompactCreateSchema
>;
export type CompanyCreateDto = z.infer<typeof companyCreateSchema>;

// Update schema allows partial updates
export const companyUpdateSchema = companySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
    nameLowercase: true,
  })
  .partial()
  .strict();

export type CompanyUpdateDto = z.infer<typeof companyUpdateSchema>;
