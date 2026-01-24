'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';
import {
  AuctionDto,
  AuctionStatusEnum,
  AuctionTypeEnum,
} from '@suba-go/shared-validation';

type UseAuctionCancelToggleOptions = {
  auction: Pick<AuctionDto, 'id' | 'status' | 'endTime' | 'startTime' | 'type'>;
  /** Called after a successful cancel/uncancel to refresh snapshot data. */
  onUpdated?: () => void;
};

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
  } catch {
    // ignore
  }
  try {
    const text = await res.text();
    if (text) return text.slice(0, 200);
  } catch {
    // ignore
  }
  return 'No se pudo realizar la operación';
}

function isPastEnd(endTime?: Date | string): boolean {
  if (!endTime) return false;
  const endMs = typeof endTime === 'string' ? Date.parse(endTime) : endTime.getTime();
  if (!Number.isFinite(endMs)) return false;
  return Date.now() > endMs;
}

function isPastStart(startTime?: Date | string): boolean {
  if (!startTime) return false;
  const startMs =
    typeof startTime === 'string' ? Date.parse(startTime) : startTime.getTime();
  if (!Number.isFinite(startMs)) return false;
  return Date.now() > startMs;
}

/**
 * Client-side helper for the Cancel/Uncancel toggle.
 *
 * Improvements over ad-hoc fetch usage:
 * - Uses apiFetch (silent NextAuth refresh on 401).
 * - Optimistic UI update with rollback on error.
 * - Prevents double submits.
 * - Applies UI rules: no uncancel after endTime (unless TEST), no toggle when COMPLETADA.
 * - Extra rule: if auction is CANCELADA, you can only uncancel before its original startTime (unless TEST).
 * - Triggers parent snapshot refresh (realtime feel without router.refresh()).
 */
export function useAuctionCancelToggle({
  auction,
  onUpdated,
}: UseAuctionCancelToggleOptions) {
  const { toast } = useToast();

  const [overrideChecked, setOverrideChecked] = useState<boolean | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const serverChecked = auction.status === AuctionStatusEnum.CANCELADA;
  const checked = overrideChecked ?? serverChecked;

  // Once snapshot matches our optimistic state, drop the override.
  useEffect(() => {
    if (overrideChecked === null) return;
    if (serverChecked === overrideChecked) setOverrideChecked(null);
  }, [overrideChecked, serverChecked]);

  const toggle = useCallback(
    async (nextChecked: boolean) => {
      if (isMutating) return;

      // Basic UI rules (backend should still enforce).
      if (auction.status === AuctionStatusEnum.COMPLETADA) {
        toast({
          title: 'Acción no permitida',
          description: 'No puedes modificar una subasta completada.',
          variant: 'destructive',
        });
        return;
      }

      if (
        nextChecked === false &&
        auction.status === AuctionStatusEnum.CANCELADA &&
        auction.type !== AuctionTypeEnum.TEST &&
        isPastStart(auction.startTime)
      ) {
        toast({
          title: 'Acción no permitida',
          description:
            'No puedes descancelar una subasta cuando ya pasó su tiempo de inicio.',
          variant: 'destructive',
        });
        return;
      }

      const prevChecked = checked;
      setOverrideChecked(nextChecked); // optimistic
      setIsMutating(true);

      // Abort any previous request (extra safety).
      try {
        abortRef.current?.abort();
      } catch {
        // ignore
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const endpoint = nextChecked
          ? `/api/auctions/${auction.id}/cancel`
          : `/api/auctions/${auction.id}/uncancel`;

        const res = await apiFetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
        });

        if (!res.ok) {
          const msg = await readErrorMessage(res);
          throw new Error(msg);
        }

        toast({
          title: nextChecked ? 'Subasta cancelada' : 'Subasta descancelada',
          description: nextChecked
            ? 'La subasta ha sido cancelada exitosamente.'
            : 'La subasta ha sido descancelada exitosamente.',
        });

        // Pull fresh snapshot right away for realtime feel.
        onUpdated?.();
      } catch (err) {
        // rollback optimistic state
        setOverrideChecked(prevChecked);
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'No se pudo realizar la operación',
          variant: 'destructive',
        });
      } finally {
        setIsMutating(false);
      }
    },
    [auction, checked, isMutating, onUpdated, toast]
  );

  return {
    checked,
    isMutating,
    toggle,
  };
}
