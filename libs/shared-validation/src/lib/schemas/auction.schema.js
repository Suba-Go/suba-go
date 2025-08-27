"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionSchema = void 0;
const zod_1 = require("zod");
const error_map_1 = require("../errors/error-map");
const main_schema_1 = require("./main.schema");
const auction_1 = require("../enums/auction");
const base_schema_1 = require("./base.schema");
zod_1.z.setErrorMap(error_map_1.errorMap);
exports.auctionSchema = base_schema_1.baseSchema
    .extend({
    public_id: zod_1.z.string(),
    name: main_schema_1.name,
    start: zod_1.z.date(),
    end: zod_1.z.date().nullable(),
    state: zod_1.z.nativeEnum(auction_1.AuctionStateEnum).default(auction_1.AuctionStateEnum.ACTIVE),
    type: zod_1.z.nativeEnum(auction_1.AuctionTypeEnum).default(auction_1.AuctionTypeEnum.REAL),
})
    .strict();
//# sourceMappingURL=auction.schema.js.map