import { z } from 'zod';
import { AuctionItemStateEnum } from '../enums/auction-item';
export declare const auctionItemSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    state: z.ZodDefault<z.ZodEnum<typeof AuctionItemStateEnum>>;
    start_price: z.ZodNumber;
    actual_price: z.ZodNumber;
    selled_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    selled_date: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
}, z.core.$strict>;
export type AuctionItemDto = z.infer<typeof auctionItemSchema>;
