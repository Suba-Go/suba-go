"use strict";
/**
 * tRPC type definitions shared across frontend and backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiStepFormInputSchema = exports.connectUserInputSchema = exports.tenantCreateInputSchema = exports.companyCreateInputSchema = exports.userCreateInputSchema = void 0;
const zod_1 = require("zod");
// Input schemas for tRPC procedures
exports.userCreateInputSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    confirmPassword: zod_1.z.string(),
});
exports.companyCreateInputSchema = zod_1.z.object({
    name: zod_1.z.string(),
    logo: zod_1.z.string().nullable().optional(),
    principal_color: zod_1.z.string().nullable().optional(),
    principal_color2: zod_1.z.string().nullable().optional(),
    secondary_color: zod_1.z.string().nullable().optional(),
    secondary_color2: zod_1.z.string().nullable().optional(),
    secondary_color3: zod_1.z.string().nullable().optional(),
});
exports.tenantCreateInputSchema = zod_1.z.object({
    name: zod_1.z.string(),
    subdomain: zod_1.z.string(),
});
exports.connectUserInputSchema = zod_1.z.object({
    tenant: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        domain: zod_1.z.string(),
    }),
    user: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        email: zod_1.z.string(),
    }),
    company: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
    }),
});
exports.multiStepFormInputSchema = zod_1.z.object({
    userData: exports.userCreateInputSchema,
    companyData: exports.companyCreateInputSchema,
    tenantData: exports.tenantCreateInputSchema,
});
//# sourceMappingURL=trpc.types.js.map