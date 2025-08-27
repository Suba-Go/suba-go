/**
 * tRPC type definitions shared across frontend and backend
 */
import { z } from 'zod';
export declare const userCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export declare const companyCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color3: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const tenantCreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    subdomain: z.ZodString;
}, z.core.$strip>;
export declare const connectUserInputSchema: z.ZodObject<{
    tenant: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        domain: z.ZodString;
    }, z.core.$strip>;
    user: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
    company: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const multiStepFormInputSchema: z.ZodObject<{
    userData: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
    }, z.core.$strip>;
    companyData: z.ZodObject<{
        name: z.ZodString;
        logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        principal_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        principal_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color3: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    tenantData: z.ZodObject<{
        name: z.ZodString;
        subdomain: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UserCreateInput = z.infer<typeof userCreateInputSchema>;
export type CompanyCreateInput = z.infer<typeof companyCreateInputSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateInputSchema>;
export type ConnectUserInput = z.infer<typeof connectUserInputSchema>;
export type MultiStepFormInput = z.infer<typeof multiStepFormInputSchema>;
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}
