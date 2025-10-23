/**
 * tRPC type definitions shared across frontend and backend
 */

import { z } from 'zod';

// Input schemas for tRPC procedures
export const userCreateInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  confirmPassword: z.string(),
});

export const companyCreateInputSchema = z.object({
  name: z.string(),
  logo: z.string().nullable().optional(),
  principal_color: z.string().nullable().optional(),
  principal_color2: z.string().nullable().optional(),
  secondary_color: z.string().nullable().optional(),
  secondary_color2: z.string().nullable().optional(),
  secondary_color3: z.string().nullable().optional(),
});

// Tenant no longer has a name field - company name is used as subdomain
export const tenantCreateInputSchema = z.object({});

export const connectUserInputSchema = z.object({
  tenant: z.object({
    id: z.string(),
    // Removed name - tenant no longer has a name field
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  company: z.object({
    id: z.string(),
    name: z.string(),
    nameLowercase: z.string(),
  }),
});

export const multiStepFormInputSchema = z.object({
  userData: userCreateInputSchema,
  companyData: companyCreateInputSchema,
  tenantData: tenantCreateInputSchema,
});

// Type exports
export type UserCreateInput = z.infer<typeof userCreateInputSchema>;
export type CompanyCreateInput = z.infer<typeof companyCreateInputSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateInputSchema>;
export type ConnectUserInput = z.infer<typeof connectUserInputSchema>;
export type MultiStepFormInput = z.infer<typeof multiStepFormInputSchema>;

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
