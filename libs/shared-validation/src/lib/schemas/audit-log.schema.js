"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const auction_log_1 = require("../enums/auction-log");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.auditLogSchema = base_schema_1.baseSchema
    .extend({
    entity: zod_1.z.string(),
    entity_id: zod_1.z.string(),
    action: zod_1.z.nativeEnum(auction_log_1.AuditLogActionEnum).default(auction_log_1.AuditLogActionEnum.CREATE),
    changes: zod_1.z.any(),
    timestamp: zod_1.z.date(),
    auction_id: zod_1.z.string(),
    auction_item_id: zod_1.z.string(),
    observation_id: zod_1.z.string(),
    bid_id: zod_1.z.string(),
})
    .strict();
//# sourceMappingURL=audit-log.schema.js.map