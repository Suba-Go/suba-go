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

/**
 * Refreshes an expired JWT token using the refresh token.
 *
 * @param token - The current JWT token containing the refresh token
 * @returns Promise<JWT | null> - Returns the new token with updated access/refresh tokens,
 *                                or null if the refresh token is expired (401 status)
 *
 * @description
 * This function attempts to refresh an expired access token by calling the backend's
 * /auth/refresh endpoint with the current refresh token. If the refresh token is also
 * expired (401 response), it returns null to trigger a logout. For other errors,
 * it throws an exception to be handled by the caller.
 */
async function refreshToken(token: JWT): Promise<JWT | null> {
  try {
    const res = await fetch(BACKEND_URL + '/auth/refresh', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token.tokens.refreshToken}`,
      },
    });

    if (!res.ok) {
      // Token expired, force logout
      if (res.status === 401) {
        return null;
      }
      throw new Error('Failed to refresh token');
    }

    const response = await res.json();

    // Check if response has superjson property (success) or is plain JSON (error)
    let deserializedData: Tokens;
    if (response.superjson) {
      deserializedData = superjson.deserialize(response.superjson) as Tokens;
    } else {
      // Plain JSON error response
      throw new Error(response.message || 'Token refresh failed');
    }

    return {
      ...token,
      tokens: deserializedData,
    };
  } catch (error) {
    // For non-401 errors, throw to prevent silent failures
    console.error('Refresh token error:', error);
    throw error;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login',
  },
  secret: AUTH_SECRET,
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
            body: JSON.stringify({
              email,
              password,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await res.json();

          // Check if response has superjson property (success) or is plain JSON (error)
          let parsedResult;
          if (result.superjson) {
            parsedResult = superjson.deserialize(result.superjson);
          } else {
            parsedResult = result;
          }

          // Handle error responses (either with error property or HTTP error status)
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

  //   Initial Sign-In: When the user first signs in, the jwt callback is called with the user object.
  //   Subsequent Requests: For every subsequent request after the initial sign-in, the jwt callback is called, but the user object is not present. Instead, the token object is provided.
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return { ...token, ...user, updatedAt: Date.now() };
      }

      if (trigger === 'update') {
        // Check if any user data has changed
        const hasChanges =
          session.user.name !== token.user.name ||
          session.user.email !== token.user.email ||
          session.user.phone !== token.user.phone ||
          session.user.rut !== token.user.rut;

        if (hasChanges) {
          const newToken = {
            tokens: token.tokens,
            updatedAt: Date.now(),
            user: {
              ...token.user,
              name: session.user.name,
              email: session.user.email,
              phone: session.user.phone,
              rut: session.user.rut,
            },
          };
          return newToken;
        }
      }

      // If token doesn't have required properties, return as-is to avoid errors
      if (!token.tokens || !token.tokens.expiresIn) {
        return token;
      }

      const currentTime = new Date().getTime();
      const expiryTime = token.tokens.expiresIn;

      if (currentTime < expiryTime) {
        return token;
      }

      try {
        const newToken = await refreshToken(token);

        // If the refresh token is expired, return token as-is
        // NextAuth will handle the session invalidation
        if (newToken === null) {
          console.warn('Refresh token expired, session will be invalidated');
          return token;
        }
        return newToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Return token as-is to prevent breaking the session callback
        return token;
      }
    },

    async session({ session, token }) {
      // If token is invalid or missing required data, return null
      // This will cause auth() to return null, which route handlers can handle
      if (!token || !token.user || !token.tokens) {
        console.error('Invalid token in session callback:', {
          hasToken: !!token,
          hasUser: !!token?.user,
          hasTokens: !!token?.tokens,
        });
        // Return null to signal invalid session
        // NextAuth will handle this and auth() will return null
        return null as any;
      }

      session.user = {
        ...token.user,
        emailVerified: token.user.emailVerified ?? null,
      };
      session.tokens = token.tokens as Tokens;
      return session;
    },
  },

  trustHost: true,
});
