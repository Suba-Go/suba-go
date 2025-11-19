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
    name: name.optional().nullable(),
    email: email,
    phone: phone.optional().nullable(),
    password,
    rut: rut.optional().nullable(),
    public_name: name.optional().nullable(),
    role: z.nativeEnum(UserRolesEnum).default(UserRolesEnum.AUCTION_MANAGER),
    tenantId: z.uuid().optional().nullable(),
    companyId: z.uuid().optional().nullable(),
  })
  .strict();

export const userCreateSchema = userSchema
  .omit({
    id: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    confirmPassword: confirmation_password,
  })
  .refine(
    (data: Record<string, unknown>) => {
      const { password: pwd, confirmPassword } = data as {
        password?: string;
        confirmPassword?: string;
      };
      return pwd === confirmPassword;
    },
    {
      message: 'Las contrasenas no coinciden',
      path: ['confirmPassword'],
    }
  );

export const userSafeSchema = userSchema.omit({
  password: true,
});

export const userBasicInfoSchema = userSafeSchema.pick({
  id: true,
  email: true,
  name: true,
  public_name: true,
});

export const userUpdateProfileSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone: phone.optional().nullable(),
    rut: rut.optional().nullable(),
    public_name: name.optional().nullable(),
  })
  .strict();

export const userWithTenantAndCompanySchema = userSafeSchema.extend({
  company: companySchema,
  tenant: tenantSchema,
});

export type UserDto = z.infer<typeof userSchema>;
export type UserCreateDto = z.infer<typeof userCreateSchema>;
export type UserSafeDto = z.infer<typeof userSafeSchema>;
export type UserBasicInfoDto = z.infer<typeof userBasicInfoSchema>;
export type UserUpdateProfileDto = z.infer<typeof userUpdateProfileSchema>;
export type UserCreateTrcpDto = z.infer<typeof userCreateSchema>;
export type UserWithTenantAndCompanyDto = z.infer<
  typeof userWithTenantAndCompanySchema
>;
