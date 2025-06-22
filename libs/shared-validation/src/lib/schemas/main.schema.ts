import { z } from 'zod';
import { validateRUT } from '../utils/validate-rut';
import { validatePhone } from '../utils/validate-phone';
import { errorMessages } from '../errors/error-map';

export const email = z.string().email({ message: errorMessages.custom.email });

export const phone = z.string().refine(
  (phone) => {
    return validatePhone(phone);
  },
  { message: errorMessages.custom.phone }
);

export const name = z
  .string()
  .min(3, { message: errorMessages.custom.name })
  .transform((name) => name.trim());

export const rut = z.string().refine(
  (rut) => {
    return validateRUT(rut);
  },
  { message: 'Debes ingresar un RUT válido' }
);

export const password = z
  .string()
  .min(8, { message: 'Contraseña debe tener largo de 8' })
  .max(100, { message: 'Largo máximo de 100' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{8,100}$/, {
    message:
      'Contraseña debe tener al menos una mayúscula, una minúscula, un caracter especial',
  });

export const confirmation_password = z.string();
