import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { baseSchema } from './base.schema';
import { tenantSchema } from './tenant.schema';
// import { userSchema } from './user.schema';

z.setErrorMap(errorMap);

export const companySchema = baseSchema
  .extend({
    name,
    nameLowercase: z.string(),
    logo: z.string().nullable().optional(),
    principal_color: z.string().nullable().optional(),
    principal_color2: z.string().nullable().optional(),
    secondary_color: z.string().nullable().optional(),
    secondary_color2: z.string().nullable().optional(),
    secondary_color3: z.string().nullable().optional(),
    tenantId: z.uuid().nullable(),
    // Relations
    get tenant() {
      return tenantSchema.nullable();
    },
    // get users() {
    //   return z.array(userSchema).nullable();
    // },
  })
  .strict();

export const companyCompactCreateSchema = companySchema.omit({
  id: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  nameLowercase: true,
  tenant: true,
  // users: true,
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
    nameLowercase: true,
    tenant: true,
    // users: true,
  })
  .strict();

export type CompanyDto = z.infer<typeof companySchema>;
export type CompanyCreateCompactDto = z.infer<
  typeof companyCompactCreateSchema
>;
export type CompanyCreateDto = z.infer<typeof companyCreateSchema>;
