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

  if (!startMs || !endMs) return backendStatus;

  // If backend says ACTIVE, trust it (unless already ended)
  if (backendStatus === 'ACTIVA') {
    if (nowMs >= endMs) return 'COMPLETADA';
    return 'ACTIVA';
  }

  // Time-driven transition (UI realtime)
  if (nowMs >= endMs) return 'COMPLETADA';
  if (nowMs >= startMs) return 'ACTIVA';

  if (backendStatus === 'PENDIENTE') return 'PENDIENTE';
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
      setNowMs(Date.now() + serverOffsetMs);
    }, tickMs);

    return () => clearInterval(id);
  }, [serverOffsetMs, tickMs, opts?.nowMs]);

  const displayStatus = useMemo(
    () => computeDisplayStatus(backendStatus, startMs, endMs, nowMs),
    [backendStatus, startMs, endMs, nowMs]
  );

  const isPending = displayStatus === 'PENDIENTE';
  const isActive = displayStatus === 'ACTIVA';
  const isCompleted = displayStatus === 'COMPLETADA';
  const isCanceled = displayStatus === 'CANCELADA';

  const timeTargetMs = isPending ? startMs : isActive ? endMs : undefined;

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
