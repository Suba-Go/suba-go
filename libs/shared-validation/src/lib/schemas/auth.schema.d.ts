import { z } from 'zod';
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type SignInDto = z.infer<typeof signInSchema>;
