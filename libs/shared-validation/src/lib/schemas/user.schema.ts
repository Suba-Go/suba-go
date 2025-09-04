import { z } from 'zod';
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

export const userSchema = baseSchema
  .extend({
    name: name,
    email: email,
    phone: phone.optional().nullable(),
    password: password,
    rut: rut.optional().nullable(),
    public_name: name.optional().nullable(),
    role: z
      .enum([
        UserRolesEnum.ADMIN,
        UserRolesEnum.USER,
        UserRolesEnum.AUCTION_MANAGER,
      ])
      .default(UserRolesEnum.AUCTION_MANAGER)
      .optional()
      .nullable(),
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

export const userUpdateProfileSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  phone: phone.optional().nullable(),
  rut: rut.optional().nullable(),
  public_name: name.optional().nullable(),
}).strict();

export type UserDto = z.infer<typeof userSchema>;
export type UserCreateDto = z.infer<typeof userCreateSchema>;
export type UserSafeDto = z.infer<typeof userSafeSchema>;
export type UserSafeWithCompanyAndTenantDto = z.infer<
  typeof userSafeWithCompanyAndTenantSchema
>;
export type UserUpdateProfileDto = z.infer<typeof userUpdateProfileSchema>;
