import { z, ZodErrorMap } from 'zod';

export const errorMap: ZodErrorMap = (issue, _ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message: `Debes ingresar ${
          issue.expected === 'string' ? 'un valor' : 'un valor adecuado'
        }`,
      };
    case z.ZodIssueCode.invalid_literal:
      return { message: `El tipo debe ser "${issue.expected}"` };
    case z.ZodIssueCode.too_small:
      return { message: 'Debes ingresar un valor' };
    default:
      return { message: 'Valor inválido' };
  }
};

export const errorMessages = {
  invalid_type: 'Debes ingresar un valor',
  invalid_literal: 'El tipo debe ser un valor adecuado',
  too_small: 'Debes ingresar un valor',
  custom: {
    phone:
      'Debes ingresar un número en formato +56 9 1234 5678 o +56 2 2123 4567',
    rut: 'Debes ingresar un RUT válido',
    name: 'Debes ingresar un nombre válido',
    email: 'Debes ingresar un email valido',
    companyName: 'Debes ingresar el nombre de la empresa',
    password: 'Debes ingresar una contraseña válida',
  },
};
