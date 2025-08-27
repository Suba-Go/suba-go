import { z } from 'zod';
import { AuditLogActionEnum } from '../enums/auction-log';
export declare const auditLogSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    entity: z.ZodString;
    entity_id: z.ZodString;
    action: z.ZodDefault<z.ZodEnum<typeof AuditLogActionEnum>>;
    changes: z.ZodAny;
    timestamp: z.ZodDate;
    auction_id: z.ZodString;
    auction_item_id: z.ZodString;
    observation_id: z.ZodString;
    bid_id: z.ZodString;
}, z.core.$strict>;
export type AuditLogDto = z.infer<typeof auditLogSchema>;
