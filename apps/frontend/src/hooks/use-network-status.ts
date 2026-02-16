'use client';

import { useEffect, useState } from 'react';

/**
 * Minimal network status hook.
 *
 * - `navigator.onLine` is not perfect, but it is a good first signal for a "no internet" state.
 * - We also expose a monotonically increasing `changeCount` to make it easy to trigger retries.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setChangeCount((c) => c + 1);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setChangeCount((c) => c + 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, changeCount };
}
