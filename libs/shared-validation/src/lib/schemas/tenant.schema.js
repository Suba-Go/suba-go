"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantCreateSchema = exports.tenantSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const main_schema_1 = require("./main.schema");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.tenantSchema = base_schema_1.baseSchema
    .extend({
    name: main_schema_1.name,
    domain: zod_1.z.string().url(),
})
    .strict();
exports.tenantCreateSchema = exports.tenantSchema
    .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
    domain: true,
})
    .strict()
    .extend({
    subdomain: zod_1.z.string().min(3).max(20),
});
//# sourceMappingURL=tenant.schema.js.map