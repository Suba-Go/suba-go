import { z } from 'zod';
import { UserRolesEnum } from '../enums/user';
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    password: z.ZodString;
    rut: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    public_name: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    role: z.ZodNullable<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        admin: UserRolesEnum.ADMIN;
        user: UserRolesEnum.USER;
        auction_manager: UserRolesEnum.AUCTION_MANAGER;
    }>>>>;
}, z.core.$strict>;
export declare const userCreateSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    password: z.ZodString;
    rut: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    public_name: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    role: z.ZodNullable<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        admin: UserRolesEnum.ADMIN;
        user: UserRolesEnum.USER;
        auction_manager: UserRolesEnum.AUCTION_MANAGER;
    }>>>>;
    confirmPassword: z.ZodString;
}, z.core.$strict>;
export declare const userSafeSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    rut: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    public_name: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    role: z.ZodNullable<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        admin: UserRolesEnum.ADMIN;
        user: UserRolesEnum.USER;
        auction_manager: UserRolesEnum.AUCTION_MANAGER;
    }>>>>;
}, z.core.$strict>;
export declare const userSafeWithCompanyAndTenantSchema: z.ZodObject<{
    name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    rut: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    public_name: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>>;
    role: z.ZodNullable<z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        admin: UserRolesEnum.ADMIN;
        user: UserRolesEnum.USER;
        auction_manager: UserRolesEnum.AUCTION_MANAGER;
    }>>>>;
    company: z.ZodObject<{
        id: z.ZodString;
        is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
        createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        logo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        principal_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        principal_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color2: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        secondary_color3: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
    tenant: z.ZodObject<{
        id: z.ZodString;
        is_deleted: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
        createdAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        updatedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        deletedAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
        name: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        domain: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
export type UserDto = z.infer<typeof userSchema>;
export type UserCreateDto = z.infer<typeof userCreateSchema>;
export type UserSafeDto = z.infer<typeof userSafeSchema>;
export type UserSafeWithCompanyAndTenantDto = z.infer<typeof userSafeWithCompanyAndTenantSchema>;
