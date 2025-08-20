import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().uuid(),
  is_deleted: z.boolean().optional().nullable(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
  deletedAt: z.date().optional().nullable(),
});

export type BaseDto = z.infer<typeof baseSchema>;
