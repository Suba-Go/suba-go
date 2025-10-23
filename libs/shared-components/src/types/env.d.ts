export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly APP_ENV?: 'local' | 'development' | 'production' | 'test';
      readonly NEXT_PUBLIC_APP_ENV?:
        | 'local'
        | 'development'
        | 'production'
        | 'test';
      readonly NEXT_PUBLIC_ROOT_DOMAIN?: string;
    }
  }
}
