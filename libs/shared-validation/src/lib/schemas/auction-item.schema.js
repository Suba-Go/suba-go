"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionItemSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const main_schema_1 = require("./main.schema");
const auction_item_1 = require("../enums/auction-item");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.auctionItemSchema = base_schema_1.baseSchema
    .extend({
    name: main_schema_1.name,
    state: zod_1.z
        .nativeEnum(auction_item_1.AuctionItemStateEnum)
        .default(auction_item_1.AuctionItemStateEnum.DISPONIBLE),
    start_price: zod_1.z.number().positive(),
    actual_price: zod_1.z.number().positive(),
    selled_price: zod_1.z.number().positive().nullable().optional(),
    selled_date: zod_1.z.date().nullable().optional(),
})
    .strict();
//# sourceMappingURL=auction-item.schema.js.map