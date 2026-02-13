/**
 * @file use-live-fallback-snapshot.ts
 * @description
 * "Pro" safety net for live pages: if the WebSocket is not fully ready (not authenticated/joined)
 * we periodically trigger an HTTP snapshot refresh (router.refresh / refetch) until realtime is back.
 *
 * Why:
 * - WS/network hiccups happen (mobile / WiFi changes / tab sleeping).
 * - Snapshot-on-join gets you consistent state once WS returns.
 * - This fallback keeps UI progressing while WS reconnects (no "stuck" screens).
 */

'use client';

import { useEffect, useRef } from 'react';

export function useLiveFallbackSnapshot(params: {
  enabled: boolean;
  onSnapshot?: () => void;
  intervalMs?: number;
}) {
  const { enabled, onSnapshot, intervalMs = 2500 } = params;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onSnapshot) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const fire = () => {
      // Avoid spamming when tab is in background.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      const now = Date.now();
      // Soft throttle in case multiple components enable fallback at once.
      if (now - lastFireRef.current < Math.max(800, intervalMs - 250)) return;
      lastFireRef.current = now;
      onSnapshot();
    };

    // Prime an immediate snapshot so UI updates quickly.
    fire();

    timerRef.current = setInterval(fire, intervalMs);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        fire();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, onSnapshot, intervalMs]);
}
