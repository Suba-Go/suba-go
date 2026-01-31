'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * useLiveAccessToken
 *
 * Why:
 * - Some client components receive an access token from a Server Component prop.
 * - If the user keeps the page open (live auctions), that prop never updates.
 * - NextAuth can rotate the token in the background; this hook always returns the
 *   latest token from `useSession()` and falls back to the initial prop.
 */
export function useLiveAccessToken(initialAccessToken?: string) {
  const { data: session } = useSession();
  const sessionToken = useMemo(
    () => (session as any)?.tokens?.accessToken as string | undefined,
    [session]
  );

  const [token, setToken] = useState<string | undefined>(
    sessionToken ?? initialAccessToken
  );

  useEffect(() => {
    // Prefer the session token when available.
    if (sessionToken) setToken(sessionToken);
    else setToken(initialAccessToken);
  }, [sessionToken, initialAccessToken]);

  return token;
}
