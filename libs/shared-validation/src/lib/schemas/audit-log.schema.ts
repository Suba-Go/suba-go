import { z } from 'zod';
import { AuditLogActionEnum } from '../enums/auction-log';
import { baseSchema } from './base.schema';

export const auditLogSchema = baseSchema
  .extend({
    action: z.nativeEnum(AuditLogActionEnum).default(AuditLogActionEnum.CREATE),
    entityType: z.string(),
    entityId: z.string(),
    changes: z.unknown().optional(),
    userId: z.uuid().optional().nullable(),
    tenantId: z.uuid().optional().nullable(),
  })
  .strict();

export type AuditLogDto = z.infer<typeof auditLogSchema>;
