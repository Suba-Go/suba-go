import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: 'Contraseña debe tener al menos 8 dígitos' })
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&_\\-])[A-Za-z\d@$!%*?&_\\-]{8,}$/,
      {
        message:
          'Contraseña debe tener al menos 8 dígitos, una mayúscula, una minúscula y un caracter especial',
      }
    ),
});
export type SignInDto = z.infer<typeof signInSchema>;
