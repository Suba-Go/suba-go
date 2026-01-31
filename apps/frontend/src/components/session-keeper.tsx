'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

// How early (ms) we try to refresh the access token before it expires.
const REFRESH_SKEW_MS = 2 * 60 * 1000; // 2 minutes

// Polling interval to check expiry (ms). Keep relatively small; the actual
// refresh only happens when we're within the skew window.
const CHECK_INTERVAL_MS = 20 * 1000; // 20 seconds

/**
 * SessionKeeper
 * - Proactively refreshes NextAuth session (and therefore access token)
 *   before expiry.
 * - Refreshes immediately on tab focus / visibility restore.
 * - If refresh is no longer possible (refresh token invalid), forces sign-out
 *   so the UI can recover cleanly.
 */
export function SessionKeeper() {
  const { data: session, status, update } = useSession();
  const lastRefreshRef = useRef<number>(0);

  const safeRefresh = async () => {
    // Avoid calling update too often (can happen with multiple triggers)
    const now = Date.now();
    if (now - lastRefreshRef.current < 5_000) return;
    lastRefreshRef.current = now;

    try {
      await update();
    } catch {
      // ignore here; we handle unrecoverable cases below via session.error
    }
  };

  // 1) Periodic expiry check.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const t = setInterval(() => {
      const expiresAt = (session as any)?.tokens?.expiresIn as number | undefined;
      if (!expiresAt) return;

      const msLeft = expiresAt - Date.now();
      if (msLeft <= REFRESH_SKEW_MS) {
        void safeRefresh();
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(t);
    // We intentionally include only the fields we need.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, (session as any)?.tokens?.expiresIn]);

  // 2) Refresh quickly when the user returns to the tab.
  useEffect(() => {
    if (status !== 'authenticated') return;

    const onFocus = () => void safeRefresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void safeRefresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 3) If refresh fails (refresh token expired/revoked), NextAuth jwt callback
  // sets `session.error = 'ReauthRequired'`. In that case we sign out.
  useEffect(() => {
    const err = (session as any)?.error as string | undefined;
    if (!err) return;

    if (err === 'ReauthRequired') {
      void signOut({ redirect: true, callbackUrl: '/login' });
    }
  }, [session]);

  return null;
}
