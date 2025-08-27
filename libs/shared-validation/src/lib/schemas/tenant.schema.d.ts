import { z } from 'zod';
export declare const tenantSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    domain: z.ZodString;
}, z.core.$strict>;
export declare const tenantCreateSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    subdomain: z.ZodString;
}, z.core.$strict>;
export type TenantDto = z.infer<typeof tenantSchema>;
export type TenantCreateDto = z.infer<typeof tenantCreateSchema>;
