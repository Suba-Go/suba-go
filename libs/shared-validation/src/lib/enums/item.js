"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemStateEnum = exports.LegalStatusEnum = void 0;
var LegalStatusEnum;
(function (LegalStatusEnum) {
    LegalStatusEnum["TRANSFERIBLE"] = "Transferible";
    LegalStatusEnum["LEASING"] = "Leasing";
    LegalStatusEnum["POSIBILIDAD_DE_ENBARGO"] = "Posibilidad de enbargo";
    LegalStatusEnum["PRENDA"] = "Prenda";
    LegalStatusEnum["OTRO"] = "Otro";
})(LegalStatusEnum || (exports.LegalStatusEnum = LegalStatusEnum = {}));
var ItemStateEnum;
(function (ItemStateEnum) {
    ItemStateEnum["DISPONIBLE"] = "Disponible";
    ItemStateEnum["VENDIDO"] = "Vendido";
    ItemStateEnum["EN_SUBASTA"] = "En subasta";
    ItemStateEnum["ELIMINADO"] = "Eliminado";
})(ItemStateEnum || (exports.ItemStateEnum = ItemStateEnum = {}));
//# sourceMappingURL=item.js.map