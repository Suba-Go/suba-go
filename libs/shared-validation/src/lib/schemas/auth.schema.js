"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signInSchema = void 0;
const zod_1 = require("zod");
exports.signInSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z
        .string()
        .min(8, { message: 'Contraseña debe tener al menos 8 dígitos' })
        .max(100)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&_\\-])[A-Za-z\d@$!%*?&_\\-]{8,}$/, {
        message: 'Contraseña debe tener al menos 8 dígitos, una mayúscula, una minúscula y un caracter especial',
    }),
});
//# sourceMappingURL=auth.schema.js.map