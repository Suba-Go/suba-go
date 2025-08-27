"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyCreateSchema = exports.companySchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const main_schema_1 = require("./main.schema");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.companySchema = base_schema_1.baseSchema
    .extend({
    name: main_schema_1.name,
    logo: zod_1.z.string().nullable().optional(),
    principal_color: zod_1.z.string().nullable().optional(),
    principal_color2: zod_1.z.string().nullable().optional(),
    secondary_color: zod_1.z.string().nullable().optional(),
    secondary_color2: zod_1.z.string().nullable().optional(),
    secondary_color3: zod_1.z.string().nullable().optional(),
})
    .strict();
exports.companyCreateSchema = exports.companySchema
    .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
})
    .strict();
//# sourceMappingURL=company.schema.js.map