import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

// Feedback status enum
export enum FeedbackStatusEnum {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
}

// Feedback categories - extensible list
export const FEEDBACK_CATEGORIES = [
  'Comentarios',
  'Feedback',
  'Consejos',
  'Críticas',
] as const;

export const feedbackSchema = baseSchema
  .extend({
    category: z.string().min(1, 'La categoría es requerida'),
    title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
    message: z.string().min(1, 'El mensaje es requerido').max(5000, 'El mensaje es demasiado largo'),
    status: z.nativeEnum(FeedbackStatusEnum).default(FeedbackStatusEnum.PENDING),
    userId: z.string().uuid(),
    tenantId: z.string().uuid(),
  })
  .strict();

export const feedbackCreateSchema = feedbackSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
    status: true, // Status is set automatically to PENDING
    userId: true, // Set from session
    tenantId: true, // Set from session
  })
  .strict();

export const feedbackUpdateSchema = feedbackSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
    userId: true,
    tenantId: true,
  })
  .partial()
  .strict();

export type FeedbackDto = z.infer<typeof feedbackSchema>;
export type FeedbackCreateDto = z.infer<typeof feedbackCreateSchema>;
export type FeedbackUpdateDto = z.infer<typeof feedbackUpdateSchema>;
