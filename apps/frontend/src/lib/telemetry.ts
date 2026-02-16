'use client';

type TelemetryEventName =
  | 'ws_state'
  | 'ws_join'
  | 'ws_message'
  | 'bid_send'
  | 'bid_send_failed'
  | 'bid_rejected'
  | 'bid_placed';

type TelemetryStore = {
  startedAt: number;
  counters: Record<string, number>;
  lastEvents: Array<{ t: number; name: TelemetryEventName; data?: unknown }>;
};

declare global {
  // eslint-disable-next-line no-var
  var __subagoTelemetry: TelemetryStore | undefined;
}

function getStore(): TelemetryStore {
  if (!globalThis.__subagoTelemetry) {
    globalThis.__subagoTelemetry = {
      startedAt: Date.now(),
      counters: {},
      lastEvents: [],
    };
  }
  return globalThis.__subagoTelemetry;
}

/**
 * Minimal, low-risk telemetry.
 *
 * - Keeps counters in-memory (per tab).
 * - Stores only the last ~50 events for debugging support.
 * - Logs to console ONLY when NEXT_PUBLIC_TELEMETRY_DEBUG=1.
 */
export function trackTelemetry(name: TelemetryEventName, data?: unknown) {
  try {
    const store = getStore();
    store.counters[name] = (store.counters[name] || 0) + 1;
    store.lastEvents.push({ t: Date.now(), name, data });
    if (store.lastEvents.length > 50) store.lastEvents.shift();

    if (process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === '1') {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', name, data ?? '');
    }
  } catch {
    // never break UX
  }
}
