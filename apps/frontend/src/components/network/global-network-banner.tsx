'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { WifiOff } from 'lucide-react';

/**
 * Global network banner.
 *
 * Goal: never "crash" the UI because of a temporary connection loss.
 * Instead we show a subtle banner while offline and keep the last UI state.
 */
export function GlobalNetworkBanner() {
  const { isOnline } = useNetworkStatus();
  const [justCameBack, setJustCameBack] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  // Prevent the "Conexión restablecida" pulse on first render.
  const prevOnlineRef = useRef<boolean | null>(null);
  const offlineDelayRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    // Debounce the offline banner to avoid flicker during quick network transitions
    if (!isOnline) {
      setJustCameBack(false);
      if (offlineDelayRef.current) window.clearTimeout(offlineDelayRef.current);
      offlineDelayRef.current = window.setTimeout(() => {
        setShowOffline(true);
        offlineDelayRef.current = null;
      }, 600);
      return;
    }

    // We are online
    setShowOffline(false);
    if (offlineDelayRef.current) {
      window.clearTimeout(offlineDelayRef.current);
      offlineDelayRef.current = null;
    }

    // Only show the "came back" pulse if we were previously offline (not on first mount)
    if (prev === false) {
      setJustCameBack(true);
      const t = window.setTimeout(() => setJustCameBack(false), 2000);
      return () => window.clearTimeout(t);
    }
  }, [isOnline]);

  const show = useMemo(() => showOffline || justCameBack, [showOffline, justCameBack]);
  if (!show) return null;

  if (showOffline) {
    return (
      <div className="sticky top-0 z-50 w-full border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-amber-900">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">Sin conexión.</span>
          <span className="opacity-80">Mostrando la última información disponible. Reintentaremos al reconectar.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-green-200 bg-green-50">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-green-900">
        <span className="font-medium">Conexión restablecida.</span>
      </div>
    </div>
  );
}
