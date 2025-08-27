"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseSchema = void 0;
const zod_1 = require("zod");
exports.baseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    is_deleted: zod_1.z.boolean().optional().nullable(),
    createdAt: zod_1.z.date().optional().nullable(),
    updatedAt: zod_1.z.date().optional().nullable(),
    deletedAt: zod_1.z.date().optional().nullable(),
});
//# sourceMappingURL=base.schema.js.map