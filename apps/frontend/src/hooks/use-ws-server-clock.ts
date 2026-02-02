'use client';

import { useEffect, useState } from 'react';
import { wsClient } from '@/lib/ws-client';
import { WsConnectionState } from '@suba-go/shared-validation';

/**
 * Provides a server-synchronized clock for UI timers.
 *
 * Timers should never depend on the local device time when real-time
 * synchronization matters (multiple users, multiple devices). Instead, we
 * maintain an offset from the server clock computed by the wsClient.
 */
export function useWsServerClock(accessToken?: string, tickMs: number = 250) {
  const [offsetMs, setOffsetMs] = useState(0);
  const [rttMs, setRttMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let alive = true;

    wsClient.connect(accessToken).catch(() => {
      // wsClient handles state transitions and retries.
    });

    const unsubSync = wsClient.onTimeSync((info) => {
      if (!alive) return;
      setOffsetMs(info.offsetMs);
      setRttMs(info.rttMs);
      setNowMs(info.serverNowMs);
      setIsSynced(true);
    });

    const unsubState = wsClient.onStateChange((state) => {
      if (!alive) return;
      if (state !== WsConnectionState.AUTHENTICATED) {
        setIsSynced(false);
      }
    });

    const tick = setInterval(() => {
      if (!alive) return;
      setNowMs(wsClient.getServerNowMs());
    }, Math.max(50, tickMs));

    return () => {
      alive = false;
      unsubSync();
      unsubState();
      clearInterval(tick);
    };
  }, [accessToken, tickMs]);

  // Backwards compatible aliases (some views use the old property names).
  return {
    offsetMs,
    serverOffsetMs: offsetMs,
    rttMs,
    nowMs,
    syncedNowMs: nowMs,
    isSynced,
  };
}
