"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observationSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const main_schema_1 = require("./main.schema");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.observationSchema = base_schema_1.baseSchema
    .extend({
    title: main_schema_1.name,
    description: zod_1.z.string(),
})
    .strict();
//# sourceMappingURL=observation.schema.js.map