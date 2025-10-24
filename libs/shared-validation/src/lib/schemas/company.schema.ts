import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { name } from './main.schema';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const companySchema = baseSchema
  .extend({
    name: name,
    nameLowercase: z.string(), // Lowercase version for case-insensitive subdomain lookup
    logo: z.string().nullable().optional(),
    principal_color: z.string().nullable().optional(),
    principal_color2: z.string().nullable().optional(),
    secondary_color: z.string().nullable().optional(),
    secondary_color2: z.string().nullable().optional(),
    secondary_color3: z.string().nullable().optional(),
  })
  .strict();

export const companyCreateSchema = companySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
    nameLowercase: true, // Generated automatically by backend
  })
  .strict();

export type CompanyDto = z.infer<typeof companySchema>;
export type CompanyCreateDto = z.infer<typeof companyCreateSchema>;
