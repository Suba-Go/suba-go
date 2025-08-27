"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmation_password = exports.password = exports.rut = exports.name = exports.phone = exports.email = void 0;
const zod_1 = require("zod");
const validate_rut_1 = require("../utils/validate-rut");
const validate_phone_1 = require("../utils/validate-phone");
const error_map_1 = require("../errors/error-map");
exports.email = zod_1.z.string().email({ message: error_map_1.errorMessages.custom.email });
exports.phone = zod_1.z.string().refine((phone) => {
    return (0, validate_phone_1.validatePhone)(phone);
}, { message: error_map_1.errorMessages.custom.phone });
exports.name = zod_1.z
    .string()
    .min(3, { message: error_map_1.errorMessages.custom.name })
    .transform((name) => name.trim());
exports.rut = zod_1.z.string().refine((rut) => {
    return (0, validate_rut_1.validateRUT)(rut);
}, { message: 'Debes ingresar un RUT válido' });
exports.password = zod_1.z
    .string()
    .min(8, { message: 'Contraseña debe tener largo de 8' })
    .max(100, { message: 'Largo máximo de 100' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{8,100}$/, {
    message: 'Contraseña debe tener al menos una mayúscula, una minúscula, un caracter especial',
});
exports.confirmation_password = zod_1.z.string();
//# sourceMappingURL=main.schema.js.map