/*
  Centralized fetch helper for calling Next.js Route Handlers (/api/...).

  Goal:
  - If the access token expired, /api calls may return 401.
  - We silently trigger a NextAuth session refresh (which runs the jwt callback and
    rotates tokens / cookies), then retry once.
  - If it still fails, the session is no longer recoverable and we sign the user out.

  This is client-side only (depends on next-auth/react).
*/

'use client';

import { getSession, signOut } from 'next-auth/react';

let refreshInflight: Promise<unknown> | null = null;

async function refreshSessionOnce(): Promise<void> {
  if (!refreshInflight) {
    refreshInflight = (async () => {
      // getSession() calls /api/auth/session and triggers NextAuth's jwt callback.
      // If token is expired and refresh token is valid, it will refresh and persist
      // a new session cookie without the user noticing.
      await getSession();
    })().finally(() => {
      refreshInflight = null;
    });
  }

  await refreshInflight;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: { retryOn401?: boolean }
): Promise<Response> {
  const retryOn401 = opts?.retryOn401 ?? true;

  const first = await fetch(input, {
    ...init,
    cache: init?.cache ?? 'no-store',
  });

  if (!retryOn401 || first.status !== 401) return first;

  // Try to refresh session silently (once per tab) and retry.
  try {
    await refreshSessionOnce();
  } catch {
    // ignore; we'll handle the retry response below
  }

  const second = await fetch(input, {
    ...init,
    cache: init?.cache ?? 'no-store',
  });

  if (second.status !== 401) return second;

  // If still 401, the refresh token is probably invalid/expired.
  // Sign out (clears cookies) and let the app redirect to login.
  try {
    await signOut({ redirect: true, callbackUrl: '/login' });
  } catch {
    // In case signOut fails (edge cases), do a hard redirect.
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  return second;
}
