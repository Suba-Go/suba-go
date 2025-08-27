"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSafeWithCompanyAndTenantSchema = exports.userSafeSchema = exports.userCreateSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
const main_schema_1 = require("./main.schema");
const user_1 = require("../enums/user");
const base_schema_1 = require("./base.schema");
const company_schema_1 = require("./company.schema");
const tenant_schema_1 = require("./tenant.schema");
exports.userSchema = base_schema_1.baseSchema
    .extend({
    name: main_schema_1.name,
    email: main_schema_1.email,
    phone: main_schema_1.phone.optional().nullable(),
    password: main_schema_1.password,
    rut: main_schema_1.rut.optional().nullable(),
    public_name: main_schema_1.name.optional().nullable(),
    role: zod_1.z
        .enum([
        user_1.UserRolesEnum.ADMIN,
        user_1.UserRolesEnum.USER,
        user_1.UserRolesEnum.AUCTION_MANAGER,
    ])
        .default(user_1.UserRolesEnum.AUCTION_MANAGER)
        .optional()
        .nullable(),
})
    .strict();
exports.userCreateSchema = exports.userSchema
    .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
})
    .extend({
    confirmPassword: main_schema_1.confirmation_password,
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
});
exports.userSafeSchema = exports.userSchema.omit({
    password: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    is_deleted: true,
});
exports.userSafeWithCompanyAndTenantSchema = exports.userSafeSchema.extend({
    company: company_schema_1.companySchema,
    tenant: tenant_schema_1.tenantSchema,
});
//# sourceMappingURL=user.schema.js.map