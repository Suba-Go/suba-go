/**
 * Environment helper to safely access APP_ENV with custom values
 *
 * Note: We use APP_ENV instead of NODE_ENV because frameworks like Next.js
 * automatically override NODE_ENV. This allows us to have a custom 'local' environment.
 */
export type AppEnvironment = 'local' | 'development' | 'production' | 'test';

export function getNodeEnv(): AppEnvironment {
  return (process.env.APP_ENV || 'development') as AppEnvironment;
}

export function isLocal(): boolean {
  return getNodeEnv() === 'local';
}

export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

export function isTest(): boolean {
  return getNodeEnv() === 'test';
}
