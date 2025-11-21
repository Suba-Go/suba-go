import { z } from 'zod';
import { email, password } from './main.schema';

export const signInSchema = z.object({
  email: email,
  password: password,
});
export type SignInDto = z.infer<typeof signInSchema>;
