/**
 * Environment helper to safely access APP_ENV with custom values
 *
 * Note: We use APP_ENV instead of NODE_ENV because Next.js automatically
 * overrides NODE_ENV to 'development' or 'production' based on the command.
 * This allows us to have a custom 'local' environment.
 */
export type AppEnvironment = 'local' | 'development' | 'production' | 'test';

export function getNodeEnv(): AppEnvironment {
  // Use NEXT_PUBLIC_APP_ENV for client-side, APP_ENV for server-side
  const appEnv =
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_APP_ENV
      : process.env.APP_ENV) || 'development';

  return appEnv as AppEnvironment;
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
