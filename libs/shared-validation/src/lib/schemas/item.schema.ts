import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { ItemStateEnum, LegalStatusEnum } from '../enums/item';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const itemSchema = baseSchema
  .extend({
    plate: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    year: z.number().int().positive().nullable().optional(),
    version: z.string().nullable().optional(),
    photos: z.string().nullable().optional(),
    docs: z.string().nullable().optional(),
    kilometraje: z.number().int().positive().nullable().optional(),
    legal_status: z.nativeEnum(LegalStatusEnum).nullable().optional(),
    state: z.nativeEnum(ItemStateEnum).default(ItemStateEnum.DISPONIBLE),
  })
  .strict();

export type ItemDto = z.infer<typeof itemSchema>;
