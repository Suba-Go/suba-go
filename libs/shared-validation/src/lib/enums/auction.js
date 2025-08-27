"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionTypeEnum = exports.AuctionStateEnum = void 0;
var AuctionStateEnum;
(function (AuctionStateEnum) {
    AuctionStateEnum["ACTIVE"] = "active";
    AuctionStateEnum["INACTIVE"] = "inactive";
    AuctionStateEnum["COMPLETED"] = "completed";
    AuctionStateEnum["CANCELLED"] = "cancelled";
})(AuctionStateEnum || (exports.AuctionStateEnum = AuctionStateEnum = {}));
var AuctionTypeEnum;
(function (AuctionTypeEnum) {
    AuctionTypeEnum["TEST"] = "test";
    AuctionTypeEnum["REAL"] = "real";
})(AuctionTypeEnum || (exports.AuctionTypeEnum = AuctionTypeEnum = {}));
//# sourceMappingURL=auction.js.map