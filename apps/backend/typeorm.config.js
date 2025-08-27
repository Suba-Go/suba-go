"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const dotenv = tslib_1.__importStar(require("dotenv"));
dotenv.config({
    path: process.env.NODE_ENV !== 'test' ? '.env' : '.env.test',
});
// Crear el DataSource con variables de entorno o valores por defecto
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.POSTGRES_URL ||
        'postgresql://postgres:postgres@localhost:5432/suba_go',
    entities: ['apps/backend/src/**/*.entity.ts'],
    migrations: ['apps/backend/src/database/migrations/*.ts'],
    synchronize: false,
    dropSchema: false,
    ssl: { rejectUnauthorized: false }, // Force SSL for Supabase
});
exports.default = AppDataSource;
//# sourceMappingURL=typeorm.config.js.map