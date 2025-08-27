"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bidSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.bidSchema = base_schema_1.baseSchema
    .extend({
    offered_price: zod_1.z.number().positive(),
    bid_time: zod_1.z.date(),
})
    .strict();
//# sourceMappingURL=bid.schema.js.map