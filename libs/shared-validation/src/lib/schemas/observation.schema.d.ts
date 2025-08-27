import { z } from 'zod';
export declare const observationSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    title: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    description: z.ZodString;
}, z.core.$strict>;
export type ObservationDto = z.infer<typeof observationSchema>;
