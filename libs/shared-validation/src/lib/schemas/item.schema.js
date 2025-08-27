"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const item_1 = require("../enums/item");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.itemSchema = base_schema_1.baseSchema
    .extend({
    plate: zod_1.z.string().nullable().optional(),
    brand: zod_1.z.string().nullable().optional(),
    model: zod_1.z.string().nullable().optional(),
    year: zod_1.z.number().int().positive().nullable().optional(),
    version: zod_1.z.string().nullable().optional(),
    photos: zod_1.z.string().nullable().optional(),
    docs: zod_1.z.string().nullable().optional(),
    kilometraje: zod_1.z.number().int().positive().nullable().optional(),
    legal_status: zod_1.z.nativeEnum(item_1.LegalStatusEnum).nullable().optional(),
    state: zod_1.z.nativeEnum(item_1.ItemStateEnum).default(item_1.ItemStateEnum.DISPONIBLE),
})
    .strict();
//# sourceMappingURL=item.schema.js.map