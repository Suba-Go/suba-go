import { z } from 'zod';
import { AuditLogActionEnum } from '../enums/auction-log';
import { baseSchema } from './base.schema';
// import { userSchema } from './user.schema';
// import { tenantSchema } from './tenant.schema';

export const auditLogSchema = baseSchema
  .extend({
    action: z.enum(AuditLogActionEnum).default(AuditLogActionEnum.CREATE),
    entityType: z.string(),
    entityId: z.string(),
    changes: z.unknown().optional(),
    userId: z.uuid().optional().nullable(),
    tenantId: z.uuid().optional().nullable(),
    // Relations
    // get user() {
    //   return userSchema.nullable();
    // },
    // get tenant() {
    //   return tenantSchema.nullable();
    // },
  })
  .strict();

export type AuditLogDto = z.infer<typeof auditLogSchema>;
