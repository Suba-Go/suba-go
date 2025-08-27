import { z } from 'zod';
export declare const bidSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    offered_price: z.ZodNumber;
    bid_time: z.ZodDate;
}, z.core.$strict>;
export type BidDto = z.infer<typeof bidSchema>;
