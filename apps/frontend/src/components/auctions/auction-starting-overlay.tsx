'use client';

import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface AuctionStartingOverlayProps {
  /** Whether the auction is still pending (source of truth: backend status). */
  enabled: boolean;
  startTime?: string | Date | null;
  serverOffsetMs?: number;
  title?: string;
  description?: string;
  /** Show overlay when remaining time is within this window (ms). */
  windowMs?: number;
  /** Optional grace after start (ms) while backend still reports pending. */
  graceMs?: number;
}

/**
 * Full-screen overlay shown shortly before an auction starts.
 * Mirrors AuctionFinalizingOverlay UX, but for the pending -> active transition.
 */
export function AuctionStartingOverlay({
  enabled,
  startTime,
  serverOffsetMs = 0,
  title = 'Iniciando subasta',
  description = 'La subasta comenzará en instantes…',
  windowMs = 10_000,
  graceMs = 5_000,
}: AuctionStartingOverlayProps) {
  const [dots, setDots] = useState('');
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const startMs = useMemo(() => {
    if (!startTime) return null;
    // Normalize "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss" for consistent parsing.
    const raw =
      typeof startTime === 'string' && startTime.includes(' ') && !startTime.includes('T')
        ? startTime.replace(' ', 'T')
        : startTime;
    const ms = new Date(raw as any).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [startTime]);

  const visible = useMemo(() => {
    if (!enabled) return false;
    if (typeof remainingMs !== 'number') return false;
    // Show in last N seconds, plus a small grace if backend hasn't flipped to ACTIVE yet.
    return remainingMs <= windowMs && remainingMs > -Math.max(0, graceMs);
  }, [enabled, remainingMs, windowMs, graceMs]);

  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % 4;
      setDots('.'.repeat(i));
    }, 400);
    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!startMs) {
      setRemainingMs(null);
      return;
    }
    const tick = () => {
      const serverNow = Date.now() + (serverOffsetMs || 0);
      setRemainingMs(startMs - serverNow);
    };

    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [enabled, startMs, serverOffsetMs]);

  const ariaLabel = useMemo(() => `${title}${dots}`, [title, dots]);

  if (!visible) return null;

  const countdown =
    typeof remainingMs === 'number' && remainingMs > 0 ? formatMs(remainingMs) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Spinner className="size-5" />
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {title}
              <span className="inline-block w-6">{dots}</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">{description}</div>
            {countdown && (
              <div className="mt-2 text-sm font-medium text-gray-900">
                Comienza en <span className="tabular-nums">{countdown}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
