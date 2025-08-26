import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV !== 'test' ? '.env' : '.env.test',
});

// Crear el DataSource con variables de entorno o valores por defecto
const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env.DB_URL ||
    'postgresql://postgres:postgres@localhost:5432/suba_go',
  entities: ['apps/backend/src/**/*.entity.ts'],
  migrations: ['apps/backend/src/database/migrations/*.ts'],
  synchronize: false,
  dropSchema: false,
  ssl: { rejectUnauthorized: false }, // Force SSL for Supabase
});

export default AppDataSource;
