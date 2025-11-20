/**
 * tRPC type definitions shared across frontend and backend
 */

import { z } from 'zod';
import { companyCompactCreateSchema, userCreateSchema } from '../schemas';

export const multiStepFormInputSchema = z.object({
  userData: userCreateSchema,
  companyData: companyCompactCreateSchema,
});

// Type exports
export type MultiStepFormInput = z.infer<typeof multiStepFormInputSchema>;

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
