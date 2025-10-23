export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly APP_ENV: 'local' | 'development' | 'production' | 'test';
      readonly NEXT_PUBLIC_APP_ENV:
        | 'local'
        | 'development'
        | 'production'
        | 'test';
      readonly BACKEND_URL: string;
      readonly AUTH_SECRET: string;
      readonly AUTH_TRUST_HOST: string;
      readonly ROOT_DOMAIN: string;
      readonly NEXT_PUBLIC_ROOT_DOMAIN: string;
      readonly BLOB_READ_WRITE_TOKEN?: string;
    }
  }
}
