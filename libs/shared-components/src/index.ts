// Use this file to export React client components (e.g. those with 'use client' directive) or other non-server utilities

// Export hooks

// Export tenant utilities
export { getSubdomainFromHost } from './lib/tenant/subdomain-from-host';

// Export environment utilities
export {
  getNodeEnv,
  isLocal,
  isDevelopment,
  isProduction,
  isTest,
  type AppEnvironment,
} from './lib/env';
