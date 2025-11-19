import { z } from 'zod';

export const baseSchema = z.object({
  id: z.uuid(),
  isDeleted: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().nullable().optional(),
});

export type BaseDto = z.infer<typeof baseSchema>;
