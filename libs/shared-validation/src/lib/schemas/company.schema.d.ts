import { z } from 'zod';
export declare const companySchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color3: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export declare const companyCreateSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    principal_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondary_color3: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type CompanyDto = z.infer<typeof companySchema>;
export type CompanyCreateDto = z.infer<typeof companyCreateSchema>;
