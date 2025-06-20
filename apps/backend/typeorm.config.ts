import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, 'src/**/!(*.view).entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/database/migrations/*{.ts,.js}')],
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
