"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessages = exports.errorMap = exports.MESSAGES = void 0;
// Error messages for different issue codes
exports.MESSAGES = {
    invalid_type: 'Debes ingresar un valor adecuado',
    too_small: 'Debes ingresar un valor',
    too_big: 'El valor es demasiado grande',
    invalid_format: 'Formato inválido',
    not_multiple_of: 'No es múltiplo del valor requerido',
    unrecognized_keys: 'Claves no reconocidas',
    invalid_union: 'Valor inválido',
    invalid_key: 'Clave inválida',
    invalid_element: 'Elemento inválido',
    invalid_value: 'Valor inválido',
    custom: 'Valor inválido',
};
// Simple error map that works with current Zod version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorMap = (issue) => {
    switch (issue.code) {
        case 'invalid_type':
            return {
                message: `Debes ingresar ${issue.expected === 'string' ? 'un valor' : 'un valor adecuado'}`,
            };
        case 'too_small':
            return { message: 'Debes ingresar un valor' };
        case 'too_big':
            return { message: 'El valor es demasiado grande' };
        case 'invalid_format':
            return { message: 'Formato inválido' };
        case 'not_multiple_of':
            return { message: 'No es múltiplo del valor requerido' };
        case 'unrecognized_keys':
            return { message: 'Claves no reconocidas' };
        case 'invalid_union':
            return { message: 'Valor inválido' };
        case 'invalid_key':
            return { message: 'Clave inválida' };
        case 'invalid_element':
            return { message: 'Elemento inválido' };
        case 'invalid_value':
            return { message: 'Valor inválido' };
        case 'custom':
            return { message: 'Valor inválido' };
        default:
            return { message: 'Valor inválido' };
    }
};
exports.errorMap = errorMap;
exports.errorMessages = {
    invalid_type: 'Debes ingresar un valor',
    too_small: 'Debes ingresar un valor',
    too_big: 'El valor es demasiado grande',
    invalid_format: 'Formato inválido',
    not_multiple_of: 'No es múltiplo del valor requerido',
    unrecognized_keys: 'Claves no reconocidas',
    invalid_union: 'Valor inválido',
    invalid_key: 'Clave inválida',
    invalid_element: 'Elemento inválido',
    invalid_value: 'Valor inválido',
    custom: {
        phone: 'Debes ingresar un número en formato +56 91234 5678 o +56 2 2123 4567',
        rut: 'Debes ingresar un RUT válido',
        name: 'Debes ingresar un nombre válido',
        email: 'Debes ingresar un email valido',
        companyName: 'Debes ingresar el nombre de la empresa',
        password: 'Debes ingresar una contraseña válida',
    },
};
//# sourceMappingURL=error-map.js.map