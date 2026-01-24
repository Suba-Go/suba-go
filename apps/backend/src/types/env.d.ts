declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    APP_ENV: 'local' | 'development' | 'production' | 'test';
    PORT: string;
    FRONTEND_URL: string;
    ROOT_DOMAIN: string;
    DATABASE_URL: string;
    PRISMA_DATABASE_URL?: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_HASH_SECRET?: string;
    JWT_ACCESS_EXPIRY_TIME: string;
    JWT_ACCESS_EXPIRY_TIME_INT: string;
    JWT_REFRESH_EXPIRY_TIME: string;
  }
}
