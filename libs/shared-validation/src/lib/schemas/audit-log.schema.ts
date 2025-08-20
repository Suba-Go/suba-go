import { z } from 'zod';
import { errorMap } from '../errors/error-map';
import { AuditLogActionEnum } from '../enums/auction-log';
import { baseSchema } from './base.schema';

z.setErrorMap(errorMap);

export const auditLogSchema = baseSchema
  .extend({
    entity: z.string(),
    entity_id: z.string(),
    action: z.nativeEnum(AuditLogActionEnum).default(AuditLogActionEnum.CREATE),
    changes: z.any(),
    timestamp: z.date(),
    auction_id: z.string(),
    auction_item_id: z.string(),
    observation_id: z.string(),
    bid_id: z.string(),
  })
  .strict();

export type AuditLogDto = z.infer<typeof auditLogSchema>;
