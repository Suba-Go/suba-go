import { z } from 'zod';
export declare const email: z.ZodString;
export declare const phone: z.ZodString;
export declare const name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const rut: z.ZodString;
export declare const password: z.ZodString;
export declare const confirmation_password: z.ZodString;
