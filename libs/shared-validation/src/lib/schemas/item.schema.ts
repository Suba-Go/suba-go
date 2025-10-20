import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { ItemStateEnum, LegalStatusEnum } from '../enums/item';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const itemSchema = baseSchema
  .extend({
    plate: z
      .string()
      .min(6, 'La patente debe tener exactamente 6 caracteres')
      .max(6, 'La patente debe tener exactamente 6 caracteres')
      .optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    year: z.number().int().positive().nullable().optional(),
    version: z.string().nullable().optional(),
    photos: z.string().nullable().optional(),
    docs: z.string().nullable().optional(),
    kilometraje: z.number().int().positive().nullable().optional(),
    legal_status: z.enum(LegalStatusEnum).nullable().optional(),
    basePrice: z.number().positive().nullable().optional(),
    state: z.enum(ItemStateEnum).default(ItemStateEnum.DISPONIBLE),
  })
  .strict();

export const itemCreateSchema = z.object({
  plate: z
    .string()
    .min(6, 'La patente debe tener exactamente 6 caracteres')
    .max(6, 'La patente debe tener exactamente 6 caracteres')
    .optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  version: z.string().optional(),
  kilometraje: z.number().int().min(0).optional(),
  legal_status: z
    .enum([
      'TRANSFERIBLE',
      'LEASING',
      'POSIBILIDAD_DE_EMBARGO',
      'PRENDA',
      'OTRO',
    ])
    .optional(),
  basePrice: z.number().positive().optional(),
  photos: z.array(z.string()).optional(),
  docs: z.array(z.instanceof(File)).optional(),
});

export const itemEditSchema = z.object({
  plate: z
    .string()
    .min(6, 'La patente debe tener exactamente 6 caracteres')
    .max(6, 'La patente debe tener exactamente 6 caracteres')
    .optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  version: z.string().optional(),
  kilometraje: z
    .any()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'number' ? val : Number(val);
      if (isNaN(num) || num <= 0) return undefined;
      return Math.floor(num); // Ensure integer
    })
    .optional(),
  legal_status: z
    .enum([
      'TRANSFERIBLE',
      'LEASING',
      'POSIBILIDAD_DE_EMBARGO',
      'PRENDA',
      'OTRO',
    ])
    .optional(),
  basePrice: z
    .any()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = typeof val === 'number' ? val : Number(val);
      if (isNaN(num) || num <= 0) return undefined;
      return num;
    })
    .optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  docs: z.array(z.string()).optional(),
});

export type ItemEditDto = z.infer<typeof itemEditSchema>;
export type ItemDto = z.infer<typeof itemSchema>;
export type ItemCreateDto = z.infer<typeof itemCreateSchema>;
