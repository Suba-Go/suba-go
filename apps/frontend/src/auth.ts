import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import credentials from 'next-auth/providers/credentials';
import superjson from 'superjson';
import { Tokens } from '@suba-go/shared-validation';

const BACKEND_URL = process.env.BACKEND_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET || !BACKEND_URL) {
  throw new Error('Missing environment variables');
}

const APP_ENV =
  process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';

// Cookie domain strategy:
// - Default: per-host cookies (best for custom domains per company).
// - If you need session shared across subdomains, set NEXTAUTH_COOKIE_DOMAIN (e.g. .subago.cl).
function getCookieDomain(): string | undefined {
  // If you want cookies shared across *subdomains* (e.g. *.subago.cl), set this explicitly.
  // For custom per-company domains (e.g. empresa-a.com, empresa-b.cl), leave it undefined.
  const explicit = process.env.NEXTAUTH_COOKIE_DOMAIN;
  if (!explicit) return undefined;

  const d = explicit.trim();
  if (!d || d.includes("localhost")) return undefined;
  return d.startsWith('.') ? d : `.${d}`;
}

const COOKIE_DOMAIN = getCookieDomain();
const USE_SECURE_COOKIES = APP_ENV !== 'local' && process.env.NODE_ENV === 'production';

const SESSION_MAX_AGE = Number(
  process.env.NEXTAUTH_SESSION_MAX_AGE ?? 60 * 60 * 24 * 7 // 7 days
);

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof (globalThis as any).atob === 'function'
        ? (globalThis as any).atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns exp (ms epoch) from an access token, if present.
 */
function getAccessTokenExpMs(accessToken?: string | null): number | undefined {
  if (!accessToken) return undefined;
  const payload = decodeJwtPayload(accessToken);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return undefined;
  // JWT exp is seconds since epoch
  return exp * 1000;
}

/**
 * Compute an absolute access-token expiry (ms epoch) from a backend `expiresIn` field.
 *
 * IMPORTANT:
 * Different backends use different semantics for `expiresIn`:
 * - duration in seconds (e.g. 3600)
 * - duration in milliseconds (e.g. 3600000)
 * - epoch seconds (e.g. 1730000000)
 * - epoch milliseconds (e.g. 1730000000000)
 *
 * We normalize everything into a single representation: **ms since epoch**.
 */
function computeExpiresAtMs(
  expiresInRaw?: number | null,
  baseMs: number = Date.now()
): number | undefined {
  if (expiresInRaw == null) return undefined;

  const v = Number(expiresInRaw);
  if (!Number.isFinite(v) || v <= 0) return undefined;

  // ms epoch (>= ~2001-09-09)
  if (v >= 1_000_000_000_000) return v;

  // seconds epoch (>= ~2001-09-09)
  if (v >= 1_000_000_000) return v * 1000;

  // Anything below here is almost certainly a duration.
  // Distinguish seconds vs milliseconds duration.
  // If it's bigger than ~31 days in seconds, it is very likely milliseconds.
  const THIRTY_ONE_DAYS_SECONDS = 31 * 24 * 60 * 60; // 2_678_400
  if (v > THIRTY_ONE_DAYS_SECONDS) {
    // milliseconds duration
    return baseMs + v;
  }

  // seconds duration
  return baseMs + v * 1000;
}

/**
 * Normalizes a previously stored expiry value (tokens.expiresIn) into ms epoch.
 * This provides backward compatibility with older cookies that might have stored:
 * - seconds duration
 * - milliseconds duration
 * - epoch seconds
 */
function normalizeStoredExpiryMs(
  stored?: number | null,
  baseMs: number = Date.now()
): number | undefined {
  if (stored == null) return undefined;
  const v = Number(stored);
  if (!Number.isFinite(v) || v <= 0) return undefined;

  // already ms epoch
  if (v >= 1_000_000_000_000) return v;

  // seconds epoch
  if (v >= 1_000_000_000) return v * 1000;

  // duration (seconds or ms) -> use baseMs (updatedAt) as reference
  return computeExpiresAtMs(v, baseMs);
}

/**
 * Refreshes an expired access token using the refresh token.
 *
 * Returns:
 * - JWT with updated tokens
 * - null when refresh token is invalid/expired -> forces logout
 */
async function refreshToken(token: JWT): Promise<JWT | null> {
  // Prevent refresh storms when multiple concurrent requests detect an expired token.
  // IMPORTANT: this must be *per refresh token* (per user/session). A global singleton mutex
  // would incorrectly mix different users' refresh flows under load.
  const refreshKey = (token as any)?.tokens?.refreshToken as string | undefined;
  if (!refreshKey) return null;

  const inflightMap: Map<string, Promise<JWT | null>> =
    ((globalThis as any).__subago_refresh_inflight_map as Map<
      string,
      Promise<JWT | null>
    >) ?? new Map();
  (globalThis as any).__subago_refresh_inflight_map = inflightMap;

  const existing = inflightMap.get(refreshKey);
  if (existing) return existing;

  try {
    const inflight = (async () => {
      // Use a short timeout so a transient backend hang doesn't immediately
      // invalidate the user's session.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(BACKEND_URL + '/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshKey}`,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        if (res.status === 401) {
          return null;
        }
        // Non-auth failures should not automatically sign the user out.
        // We'll let the caller decide how to handle this.
        throw new Error(`Failed to refresh token (status ${res.status})`);
      }

      const response = await res.json();

      let deserializedData: Tokens;
      if (response.superjson) {
        deserializedData = superjson.deserialize(response.superjson) as Tokens;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }

      const baseMs = Date.now();

      // Normalize backend expiry into an absolute ms epoch timestamp.
      const expFromBackend = computeExpiresAtMs(deserializedData.expiresIn, baseMs);
      const expFromJwt = getAccessTokenExpMs(deserializedData.accessToken);

      // Effective expiry = earliest known expiry.
      const candidates = [expFromBackend, expFromJwt].filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const effectiveExpiresAt = candidates.length ? Math.min(...candidates) : 0;

      const normalizedTokens: Tokens = {
        ...deserializedData,
        // We store an absolute expiry (ms epoch) in `expiresIn` for consistent checks.
        expiresIn: effectiveExpiresAt,
      };

      return {
        ...token,
        tokens: normalizedTokens,
        updatedAt: Date.now(),
        error: undefined,
      };
    })();

    inflightMap.set(refreshKey, inflight);
    return await inflight;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  } finally {
    // Remove only this key, never clear the whole map.
    const map: Map<string, Promise<JWT | null>> = (globalThis as any)
      .__subago_refresh_inflight_map;
    map?.delete(refreshKey);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  secret: AUTH_SECRET,

  // Professional cookie setup for subdomain multi-tenancy
  cookies: {
    sessionToken: {
      name: USE_SECURE_COOKIES
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: USE_SECURE_COOKIES,
        domain: COOKIE_DOMAIN,
      },
    },
    csrfToken: {
      name: USE_SECURE_COOKIES
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: USE_SECURE_COOKIES,
        // __Host- cookies MUST NOT set domain.
        domain: USE_SECURE_COOKIES ? undefined : COOKIE_DOMAIN,
      },
    },
    callbackUrl: {
      name: USE_SECURE_COOKIES
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: USE_SECURE_COOKIES,
        domain: COOKIE_DOMAIN,
      },
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60, // refresh cookie at most once per hour
  },

  jwt: {
    maxAge: SESSION_MAX_AGE,
  },

  providers: [
    credentials({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'email',
          type: 'email',
          placeholder: 'email@email.com',
        },
        password: { label: 'password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const { email, password } = credentials;

          const res = await fetch(BACKEND_URL + '/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await res.json();

          // Backend uses superjson interceptor on success
          const parsedResult = result.superjson
            ? superjson.deserialize(result.superjson)
            : result;

          // Handle error responses
          if (parsedResult.error || parsedResult.statusCode) {
            console.error(
              'Authentication failed:',
              parsedResult.message || 'Unknown error'
            );
            return null;
          }

          return parsedResult;
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        // Normalize token expiry to avoid backend/JWT mismatches.
        const t: any = (user as any)?.tokens;
        if (t?.accessToken) {
          const baseMs = Date.now();
          const expFromJwt = getAccessTokenExpMs(t.accessToken);
          const expFromBackend = computeExpiresAtMs(t.expiresIn, baseMs);

          const candidates = [expFromBackend, expFromJwt].filter(
            (v): v is number => typeof v === 'number' && v > 0
          );
          const effectiveExpiry = candidates.length ? Math.min(...candidates) : undefined;

          // We store an absolute expiry (ms epoch) in `expiresIn`.
          t.expiresIn =
            effectiveExpiry ?? computeExpiresAtMs(t.expiresIn, baseMs) ?? 0;
        }

        return { ...token, ...user, updatedAt: Date.now(), error: undefined };
      }

      // Profile updates -> keep token.user in sync
      if (trigger === 'update' && session?.user) {
        const hasChanges =
          session.user.name !== token.user?.name ||
          session.user.email !== token.user?.email ||
          session.user.phone !== token.user?.phone ||
          session.user.rut !== token.user?.rut;

        if (hasChanges) {
          return {
            tokens: token.tokens,
            updatedAt: Date.now(),
            user: {
              ...token.user,
              name: session.user.name,
              email: session.user.email,
              phone: session.user.phone,
              rut: session.user.rut,
            },
            error: undefined,
          } as any;
        }
      }

      // If token doesn't have required properties -> invalidate
      if (!token?.tokens) {
        return null as any;
      }

      // IMPORTANT:
      // Do NOT immediately invalidate the session on refresh failures.
      // Under load (multiple tabs / multiple API bursts / serverless concurrency)
      // you can get a transient 401 from /auth/refresh if another request already
      // rotated the refresh token and updated the cookie. If we logged the user
      // out immediately, they get kicked to /login even though they *could* recover.

	      const currentTime = Date.now();
	      const baseMs = (token as any).updatedAt ?? currentTime;
	      const expiryFromBackend = normalizeStoredExpiryMs(token.tokens.expiresIn, baseMs);
      const expiryFromJwt = getAccessTokenExpMs(token.tokens.accessToken);

      // Effective expiry = the earliest known expiry (avoid mismatches between backend config and JWT exp)
      const candidates = [expiryFromBackend, expiryFromJwt].filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const effectiveExpiry = candidates.length ? Math.min(...candidates) : undefined;

      // Refresh a bit BEFORE it expires to avoid clock drift / race conditions.
      // Using 2 minutes reduces the chances of the token expiring during a websocket/API burst.
      const SKEW_MS = 120_000;

      // If we can't determine expiry -> treat as expired and try refresh
      if (!effectiveExpiry) {
        try {
          const newToken = await refreshToken(token);
          if (!newToken) {
            // Don't hard-logout immediately. This can happen transiently if another
            // request already rotated the refresh token and updated the cookie.
            return {
              ...token,
              error: 'RefreshRejected',
              refreshRejectedAt: (token as any).refreshRejectedAt ?? Date.now(),
            } as any;
          }
          return newToken as any;
        } catch (error) {
          // Keep the session alive on transient errors and retry on the next refetch.
          return { ...token, error: 'RefreshFailed', refreshErrorAt: Date.now() } as any;
        }
      }

      // If we recently had a refresh rejection, allow a short grace window where the
      // session stays alive so the client can receive the updated cookie and recover.
      if ((token as any).error === 'RefreshRejected') {
        const rejectedAt = (token as any).refreshRejectedAt ?? currentTime;
        const GRACE_MS = 10 * 60_000; // 10 minutes (session recovery window)

        // If access token is still valid, keep going normally.
        if (currentTime < effectiveExpiry) {
          return token;
        }

        // If access token is expired but we're still in grace, keep session alive.
        if (currentTime - rejectedAt < GRACE_MS) {
          return token;
        }

        // Past grace window: do NOT hard-logout automatically. Keep session so UI can recover or prompt re-auth.
        return { ...token, error: "ReauthRequired" } as any;
      }

      // Access token still valid
      if (currentTime < effectiveExpiry - SKEW_MS) {
        // keep expiresIn normalized in memory (helps downstream checks)
        if (expiryFromBackend && token.tokens.expiresIn !== expiryFromBackend) {
          token.tokens.expiresIn = expiryFromBackend;
        }
        return token;
      }

      // Access token expired -> refresh
      try {
        const newToken = await refreshToken(token);
        if (newToken === null) {
          return {
            ...token,
            error: 'RefreshRejected',
            refreshRejectedAt: (token as any).refreshRejectedAt ?? Date.now(),
          } as any;
        }
        return newToken as any;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Do NOT wipe the session on transient refresh errors.
        // The SessionProvider (refetchInterval=60) will retry shortly.
        return { ...token, error: 'RefreshFailed', refreshErrorAt: Date.now() } as any;
      }
    },

    async session({ session, token }) {
      if (!token || !(token as any).user || !(token as any).tokens) {
        return null as any;
      }

      // propagate token error for client-side handling if needed
      (session as any).error = (token as any).error;

      session.user = {
        ...(token as any).user,
        email: (token as any).user?.email ?? null,
        emailVerified: null,
      };

      (session as any).tokens = (token as any).tokens as Tokens;
      return session;
    },
  },

  events: {
    async signOut(message) {
      try {
        // JWT sessions provide token in signOut event
        const t = (message as any)?.token as any;
        const refresh = t?.tokens?.refreshToken;
        if (!refresh) return;

        await fetch(BACKEND_URL + '/auth/logout', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${refresh}`,
          },
        });
      } catch (e) {
        // best-effort revocation
        console.warn('Logout revocation failed:', e);
      }
    },
  },

  trustHost: true,
});
