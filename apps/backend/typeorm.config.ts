import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV !== 'test' ? '.env.development' : '.env.test',
});

// Crear el DataSource con variables de entorno o valores por defecto
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'pasword',
  database: process.env.DB_NAME || 'suba_go',
  entities: ['apps/backend/src/**/*.entity.ts'],
  migrations: ['apps/backend/src/database/migrations/*.ts'],
  synchronize: false,
  dropSchema: false,
});

export default AppDataSource;
