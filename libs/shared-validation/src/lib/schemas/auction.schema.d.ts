import { z } from 'zod';
import { AuctionStateEnum, AuctionTypeEnum } from '../enums/auction';
export declare const auctionSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    public_id: z.ZodString;
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    start: z.ZodDate;
    end: z.ZodNullable<z.ZodDate>;
    state: z.ZodDefault<z.ZodEnum<typeof AuctionStateEnum>>;
    type: z.ZodDefault<z.ZodEnum<typeof AuctionTypeEnum>>;
}, z.core.$strict>;
export type AuctionDto = z.infer<typeof auctionSchema>;
