import { z } from 'zod';
import { ItemStateEnum, LegalStatusEnum } from '../enums/item';
import { baseSchema } from './base.schema';
import { userBasicInfoSchema } from './user.schema';

export const itemSchema = baseSchema
  .extend({
    plate: z
      .string()
      .min(6, 'La patente debe tener exactamente 6 caracteres')
      .max(6, 'La patente debe tener exactamente 6 caracteres'),
    brand: z.string().nullable(),
    model: z.string().nullable(),
    year: z.number().int().min(1900).max(3000).nullable(),
    version: z.string().nullable(),
    photos: z.string().nullable(),
    docs: z.string().nullable(),
    kilometraje: z.number().int().nullable(),
    legal_status: z.enum(LegalStatusEnum).nullable(),
    state: z.enum(ItemStateEnum).default(ItemStateEnum.DISPONIBLE),
    description: z.string().optional().nullable(),
    basePrice: z.number().nullable(),
    soldPrice: z.number().nullable(),
    soldAt: z.date().nullable(),
    soldToUserId: z.uuid().nullable(),
    tenantId: z.uuid(),
  })
  .strict();

export const itemWithSoldToUserSchema = itemSchema.extend({
  get soldToUser() {
    return userBasicInfoSchema.nullable();
  },
});

export const itemCreateSchema = z
  .object({
    plate: z
      .string()
      .min(6, 'La patente debe tener exactamente 6 caracteres')
      .max(6, 'La patente debe tener exactamente 6 caracteres'),
    brand: z.string().min(2, 'La marca es requerida'),
    model: z.string().optional(),
    year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional(),
    version: z.string().optional(),
    kilometraje: z.number().int().min(0).optional(),
    legal_status: z.enum(LegalStatusEnum),
    basePrice: z
      .number({ message: 'El precio base debe ser un número' })
      .positive('El precio base debe ser un número positivo')
      .min(1, 'El precio base debe ser mayor a 0'),
    photos: z.array(z.string()).optional(),
    docs: z.array(z.instanceof(File)).optional(),
  })
  .strict();

export const itemEditSchema = z
  .object({
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
        if (Number.isNaN(num) || num < 0) return undefined;
        return Math.floor(num);
      })
      .optional(),
    legal_status: z.enum(LegalStatusEnum).optional(),
    basePrice: z
      .any()
      .transform((val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        const num = typeof val === 'number' ? val : Number(val);
        if (Number.isNaN(num) || num <= 0) return undefined;
        return num;
      })
      .optional(),
    photos: z.array(z.string()).optional(),
    docs: z.array(z.string()).optional(),
  })
  .strict();

export type ItemDto = z.infer<typeof itemSchema>;
export type ItemWithSoldToUserDto = z.infer<typeof itemWithSoldToUserSchema>;
export type ItemCreateDto = z.infer<typeof itemCreateSchema>;
export type ItemEditDto = z.infer<typeof itemEditSchema>;
