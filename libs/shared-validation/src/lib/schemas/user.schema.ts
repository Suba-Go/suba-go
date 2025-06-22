import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { email, name, password, phone, rut } from './main.schema';
import { UserRolesEnum } from '../enums/user';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const userSchema = baseSchema
  .extend({
    name: name,
    email: email,
    phone: phone,
    password: password,
    rut: rut.optional().nullable(),
    public_name: name,
    role: z.nativeEnum(UserRolesEnum),
  })
  .strict();

export type UserDto = z.infer<typeof userSchema>;
