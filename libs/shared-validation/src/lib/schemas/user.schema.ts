import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import {
  confirmation_password,
  email,
  name,
  password,
  phone,
  rut,
} from './main.schema';
import { UserRolesEnum } from '../enums/user';
import { baseSchema } from './base.schema';
import { companySchema } from './company.schema';
import { tenantSchema } from './tenant.schema';

z.setErrorMap(errorMap);

export const userSchema = baseSchema
  .extend({
    name: name,
    email: email,
    phone: phone.optional().nullable(),
    password: password,
    rut: rut.optional().nullable(),
    public_name: name.optional().nullable(),
    role: z.nativeEnum(UserRolesEnum).optional().nullable(),
  })
  .strict();

export const userCreateSchema = userSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
  })
  .extend({
    confirmPassword: confirmation_password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
  });

export const userSafeSchema = userSchema.omit({
  password: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  is_deleted: true,
});

export const userSafeWithCompanyAndTenantSchema = userSafeSchema.extend({
  company: companySchema,
  tenant: tenantSchema,
});

export type UserDto = z.infer<typeof userSchema>;
export type UserCreateDto = z.infer<typeof userCreateSchema>;
export type UserSafeDto = z.infer<typeof userSafeSchema>;
export type UserSafeWithCompanyAndTenantDto = z.infer<
  typeof userSafeWithCompanyAndTenantSchema
>;
