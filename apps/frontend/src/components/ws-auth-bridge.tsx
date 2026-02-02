'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { wsClient } from '@/lib/ws-client';
import { WsConnectionState } from '@suba-go/shared-validation';

// How early (ms) we try to refresh the access token before it expires
// specifically for WebSocket reconnects.
const WS_REFRESH_SKEW_MS = 60 * 1000; // 60 seconds

type TokensShape = {
  accessToken?: string;
  expiresIn?: number; // absolute ms timestamp
};

/**
 * WsAuthBridge
 *
 * Keeps the singleton wsClient authenticated over long-lived sessions:
 * - Provides a tokenProvider so wsClient reconnects use the latest token.
 * - Proactively refreshes the NextAuth session when token is near expiry.
 * - Reconnects the WS when the access token rotates (refresh).
 */
export function WsAuthBridge() {
  const { data: session, status, update } = useSession();

  const tokens = useMemo<TokensShape>(() => {
    const t = (session as any)?.tokens;
    return {
      accessToken: t?.accessToken as string | undefined,
      expiresIn: typeof t?.expiresIn === 'number' ? (t.expiresIn as number) : undefined,
    };
  }, [session]);

  const refreshInFlightRef = useRef<Promise<any> | null>(null);
  const lastTokenRef = useRef<string | undefined>(undefined);

  const safeUpdate = async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;
    refreshInFlightRef.current = update().finally(() => {
      refreshInFlightRef.current = null;
    });
    return refreshInFlightRef.current;
  };

  // Provide an async token provider so WS reconnects do not loop with an expired token.
  useEffect(() => {
    if (status !== 'authenticated') {
      wsClient.setTokenProvider(undefined);
      return;
    }

    wsClient.setTokenProvider(async () => {
      const accessToken = tokens.accessToken;
      const expiresAt = tokens.expiresIn;
      if (!accessToken) return undefined;

      if (typeof expiresAt === 'number') {
        const msLeft = expiresAt - Date.now();
        if (msLeft <= WS_REFRESH_SKEW_MS) {
          const updated = await safeUpdate().catch(() => null);
          const next = (updated as any)?.tokens?.accessToken as string | undefined;
          return next || accessToken;
        }
      }

      return accessToken;
    });

    // Ensure we establish the initial WS connection as soon as the user is authenticated.
    // Without this, pages that only "join" rooms may show "offline" until a full refresh.
    const state = wsClient.getState();
    if (state === WsConnectionState.DISCONNECTED && tokens.accessToken) {
      wsClient.connect(tokens.accessToken).catch(() => {
        // wsClient handles reconnection internally and the bridge will refresh tokens if needed.
      });
    }

    return () => {
      wsClient.setTokenProvider(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tokens.accessToken, tokens.expiresIn]);

  // When the access token changes (refresh/rotation), reconnect using the new token.
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!tokens.accessToken) return;

    if (lastTokenRef.current && lastTokenRef.current !== tokens.accessToken) {
      // Fire-and-forget reconnect; wsClient deduplicates connections per token.
      void wsClient.connect(tokens.accessToken);
    }

    lastTokenRef.current = tokens.accessToken;
  }, [status, tokens.accessToken]);

  // If the user logs out, explicitly close the socket so we don't reconnect.
  useEffect(() => {
    if (status === 'unauthenticated') {
      wsClient.disconnect(true);
      lastTokenRef.current = undefined;
    }
  }, [status]);

  return null;
}
