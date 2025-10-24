/**
 * Authentication-related type definitions
 * Shared across all applications in the TurboShop monorepo
 */

/**
 * JWT tokens interface for authentication
 * Used by NextAuth and backend authentication services
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT payload interface for access tokens
 */
export interface JwtPayload {
  sub?: string; // User ID
  email: string;
  role: string;
  tenantId?: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Refresh token payload interface
 */
export interface RefreshPayload {
  sub: string; // User ID
  iat?: number;
  exp?: number;
}
