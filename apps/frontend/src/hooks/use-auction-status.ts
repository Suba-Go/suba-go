'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

export type AuctionDisplayStatus =
  | 'PENDIENTE'
  | 'ACTIVA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | string;

export interface TimeRemainingDetailed {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface AuctionStatusResult {
  displayStatus: AuctionDisplayStatus;
  isPending: boolean;
  /** startTime already passed but backend still PENDIENTE */
  isStarting: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isCanceled: boolean;
  timeRemaining?: string;
  timeRemainingDetailed?: TimeRemainingDetailed;
  nowMs: number;
  startMs: number;
  endMs: number;
}

function toMs(value: string | Date): number {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return 0;

  // Prefer strict-ish ISO parsing, but tolerate common DB formats like:
  // "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm:ss.SSS".
  // Some browsers treat those as invalid unless we convert to ISO-like "T".
  let candidate = raw;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(raw)) {
    candidate = raw.replace(' ', 'T');
  }

  const parsed = Date.parse(candidate);
  if (Number.isFinite(parsed)) return parsed;

  // Fallback to Date constructor parsing (covers some additional formats)
  const d = new Date(raw);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function computeDisplayStatus(
  backendStatus: string,
  startMs: number,
  endMs: number,
  nowMs: number
): AuctionDisplayStatus {
  // Terminal states always win
  if (backendStatus === 'CANCELADA') return 'CANCELADA';
  if (backendStatus === 'COMPLETADA') return 'COMPLETADA';

  // IMPORTANT:
  // Do NOT infer terminal states (COMPLETADA) from the client clock.
  // With per-item soft-close timers (each product can extend independently),
  // the auction must only be marked completed when the backend finalizes it.
  // This prevents the manager UI from showing "Completada" while items are still active.
  return backendStatus;
}

function buildDetailed(deltaMs: number): TimeRemainingDetailed {
  const totalSeconds = Math.max(0, Math.floor(deltaMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalSeconds, hours, minutes, seconds };
}

export function useAuctionStatus(
  backendStatus: string,
  startTime: string | Date,
  endTime: string | Date,
  opts?: {
    /** serverTime - clientTime */
    serverOffsetMs?: number;
    /** default 1000ms */
    tickMs?: number;
    /** Optional externally-provided nowMs (already server-synced). If provided, the hook won't create its own interval. */
    nowMs?: number;
  }
): AuctionStatusResult {
  const serverOffsetMs = opts?.serverOffsetMs ?? 0;
  const tickMs = opts?.tickMs ?? 1000;

  const startMs = useMemo(() => toMs(startTime), [startTime]);
  const endMs = useMemo(() => toMs(endTime), [endTime]);

  const [nowMs, setNowMs] = useState(() => (typeof opts?.nowMs === 'number' ? opts!.nowMs : Date.now() + serverOffsetMs));

  // Recompute time-based status each tick
  useEffect(() => {
    // If a parent provides a server-synced clock, just mirror it (no per-timer intervals).
    if (typeof opts?.nowMs === 'number') {
      setNowMs(opts.nowMs);
      return;
    }

    if (!tickMs || tickMs <= 0) return;

    const id = setInterval(() => {
      const next = Date.now() + serverOffsetMs;
      // Monotonic clock: never allow perceived "server now" to go backwards.
      // Under stress/reconnects, serverOffsetMs can be recalculated and (without this)
      // countdowns can "gain" seconds, which feels like the timer resets incorrectly.
      setNowMs((prev) => (next > prev ? next : prev));
    }, tickMs);

    return () => clearInterval(id);
  }, [serverOffsetMs, tickMs, opts?.nowMs]);

  const displayStatus = useMemo(
    () => computeDisplayStatus(backendStatus, startMs, endMs, nowMs),
    [backendStatus, startMs, endMs, nowMs]
  );

  const isPending = displayStatus === 'PENDIENTE';
  // Friendly transitional state: startTime passed, but we still wait for backend to flip to ACTIVA.
  // This prevents UI contradictions (timer says active while backend still pending) and avoids requiring refresh.
  const isStarting = isPending && startMs > 0 && nowMs >= startMs && (endMs <= 0 || nowMs < endMs);
  const isActive = displayStatus === 'ACTIVA';
  const isCompleted = displayStatus === 'COMPLETADA';
  const isCanceled = displayStatus === 'CANCELADA';

  const timeTargetMs = isPending && !isStarting ? startMs : isActive ? endMs : undefined;

  const timeRemainingDetailed = useMemo(() => {
    if (!timeTargetMs) return undefined;
    return buildDetailed(timeTargetMs - nowMs);
  }, [timeTargetMs, nowMs]);

  const timeRemaining = useMemo(() => {
    if (!timeTargetMs) return undefined;

    // Convert to a date relative to the client clock for correct wording
    const clientNow = Date.now();
    const clientTarget = new Date(clientNow + (timeTargetMs - (clientNow + serverOffsetMs)));

    return formatDistanceStrict(new Date(clientNow), clientTarget, { locale: es });
  }, [timeTargetMs, serverOffsetMs, nowMs]);

  return {
    displayStatus,
    isPending,
    isStarting,
    isActive,
    isCompleted,
    isCanceled,
    timeRemaining,
    timeRemainingDetailed,
    nowMs,
    startMs,
    endMs,
  };
}
