/**
 * @file auction-active-bidding-view-refactored.tsx
 * @description Refactored USER view for active auctions with real-time bidding
 * @author Suba&Go
 */
'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { AlertCircle } from 'lucide-react';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { AuctionHeader } from './auction-header';
import { AuctionFinalizingOverlay } from '../auction-finalizing-overlay';
// import { ConnectionStatus } from './connection-status';
import { AuctionItemCard } from './auction-item-card';
import { SelfBidWarningDialog, AutoBidConfirmDialog } from './bidding-dialogs';
import { useAuctionWebSocketBidding } from '@/hooks/use-auction-websocket-bidding';
import { useAutoBidSettings } from '@/hooks/use-auto-bid-settings';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';

interface AuctionActiveBiddingViewProps {
  auction: AuctionDto;
  accessToken: string;
  tenantId: string;
  userId: string;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  onRealtimeSnapshot?: () => void;
}

interface BidState {
  [auctionItemId: string]: {
    amount: string;
    isPending: boolean;
    error: string | null;
    pendingRequestId?: string;
  };
}

interface ItemBidHistory {
  [auctionItemId: string]: Array<{
    id: string;
    amount: number;
    userId: string;
    userName: string;
    timestamp: number;
  }>;
}

type WinnerByItem = Record<string, string | undefined>;

export function AuctionActiveBiddingView({
  auction,
  auctionItems,
  accessToken,
  tenantId,
  userId,
  onRealtimeSnapshot,
}: AuctionActiveBiddingViewProps) {
  const [bidStates, setBidStates] = useState<BidState>({});
  const [bidHistory, setBidHistory] = useState<ItemBidHistory>({});

  // Keep item positions stable during live updates (avoid confusion when bids arrive).
  // We lock the initial order we see for each item id and sort by that order thereafter.
  const itemOrderRef = useRef<Map<string, number>>(new Map());
  const [itemOrderVersion, setItemOrderVersion] = useState(0);

  useEffect(() => {
    if (!auctionItems) return;
    let changed = false;
    for (const ai of auctionItems) {
      const id = String(ai.id);
      if (!itemOrderRef.current.has(id)) {
        itemOrderRef.current.set(id, itemOrderRef.current.size);
        changed = true;
      }
    }
    if (changed) setItemOrderVersion((v) => v + 1);
  }, [auctionItems]);

  const stableAuctionItems = useMemo(() => {
    if (!auctionItems) return [];
    const order = itemOrderRef.current;
    return [...auctionItems].sort((a, b) => {
      const oa = order.get(String(a.id));
      const ob = order.get(String(b.id));
      return (oa ?? 0) - (ob ?? 0);
    });
  }, [auctionItems, itemOrderVersion]);
  // Authoritative winner per item, updated from WS events and API snapshots.
  // This avoids a UX bug where multiple users can see "Ganando" at the same time
  // if the local bid history is briefly inconsistent.
  const [winnerByItemId, setWinnerByItemId] = useState<WinnerByItem>({});
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);
  const [selfBidWarning, setSelfBidWarning] = useState<{
    auctionItemId: string;
    amount: number;
  } | null>(null);
  const [pendingAutoBid, setPendingAutoBid] = useState<{
    auctionItemId: string;
    maxPrice: number;
  } | null>(null);

  const [isFinalizingAuction, setIsFinalizingAuction] = useState(false);
  const finalizingOnceRef = useRef(false);

  // Per-item clock (independent timers). Each item can be extended (soft-close) without affecting others.
  const [itemTimes, setItemTimes] = useState<Record<string, { startTime: string | Date; endTime: string | Date }>>({});

  // Derived overall end time (max of item endTimes). Used internally to show a
  // "finalizando" overlay when the last item reaches 0.
  const overallEndTime = useMemo(() => {
    const values = Object.values(itemTimes);
    if (!values.length) return auction.endTime;
    let maxMs = new Date(auction.endTime as any).getTime();
    for (const v of values) {
      const ms = new Date(v.endTime as any).getTime();
      if (Number.isFinite(ms) && ms > maxMs) maxMs = ms;
    }
    return new Date(maxMs);
  }, [itemTimes, auction.endTime]);

  // Toast must be initialized before being referenced by callbacks below.
  const { toast } = useToast();

  const handleAuctionStatusChanged = useCallback(
    (status: string) => {
      // If the auction finished while the user was bidding, ensure we don't leave any item
      // stuck in a "pujando" state and refresh the snapshot so the router swaps to the
      // completed view for all connected clients.
      setBidStates((prev) => {
        const next: BidState = { ...prev };
        Object.keys(next).forEach((auctionItemId) => {
          next[auctionItemId] = {
            ...next[auctionItemId],
            isPending: false,
            pendingRequestId: undefined,
          };
        });
        return next;
      });

      // Optional UX: show a lightweight toast. We avoid declaring winner here because
      // that depends on backend adjudication.
      if (status === 'COMPLETADA') {
        if (!finalizingOnceRef.current) {
          finalizingOnceRef.current = true;
          setIsFinalizingAuction(true);
        }
        toast({
          title: 'Subasta finalizada',
          description: 'Finalizando subasta...',
        });
      }

      onRealtimeSnapshot?.();
    },
    [onRealtimeSnapshot, toast]
  );

  // Track pending bid timeouts to avoid stuck loading
  const pendingBidTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  // Custom hooks
  const { autoBidSettings, updateAutoBidSetting, removeAutoBidSetting } =
    useAutoBidSettings(auction.id);
  const getHighestFromApi = (ai: AuctionItemWithItmeAndBidsDto) => {
    const highestApiBid =
      ai.bids && ai.bids.length > 0
        ? Math.max(...ai.bids.map((b) => Number(b.offered_price || 0)))
        : 0;
    return Math.max(highestApiBid, Number(ai.startingBid || 0));
  };

  const getHighestBidderFromApi = (ai: AuctionItemWithItmeAndBidsDto) => {
    if (!ai.bids || ai.bids.length === 0) return undefined;
    // toma la puja más alta
    const sorted = [...ai.bids].sort(
      (a, b) => Number(b.offered_price || 0) - Number(a.offered_price || 0)
    );
    return sorted[0]?.userId;
  };

  // WebSocket handlers
  const handleBidPlaced = useCallback(
    (data: any) => {
      const {
        auctionItemId,
        amount,
        userId: bidderId,
        userName,
        bidId,
        timestamp,
      } = data;

      // A successful BID_PLACED implies this bidder is the current highest.
      // Store winner explicitly so the badge can't be "true" for multiple users.
      if (auctionItemId && bidderId) {
        setWinnerByItemId((prev) => ({
          ...prev,
          [String(auctionItemId)]: String(bidderId),
        }));
      }

      const pending = pendingBidTimeoutsRef.current.get(auctionItemId);
      if (pending) {
        clearTimeout(pending);
        pendingBidTimeoutsRef.current.delete(auctionItemId);
      }

      setBidHistory((prev) => {
        const current = prev[auctionItemId] || [];
        const incoming = {
          id: bidId,
          amount,
          userId: bidderId,
          userName: userName || 'Usuario',
          timestamp,
        };
        const merged = [incoming, ...current].reduce((acc, bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, [] as typeof current);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        return {
          ...prev,
          [auctionItemId]: merged.slice(0, 10),
        };
      });

      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          isPending: false,
          error: null,
          pendingRequestId: undefined,
          amount: (amount + Number(auction.bidIncrement || 50000)).toString(),
        },
      }));

      // Toast de éxito solo para la puja del usuario actual
      if (bidderId === userId) {
        toast({
          description:
            'Tu puja se realizó con éxito, estás ganando hasta el momento.',
          duration: 1300,
        });
      }
    },
    [userId, auction.bidIncrement, toast]
  );

  const handleBidRejected = useCallback(
    (data: any) => {
      const { auctionItemId, reason } = data;

      const pending = pendingBidTimeoutsRef.current.get(auctionItemId);
      if (pending) {
        clearTimeout(pending);
        pendingBidTimeoutsRef.current.delete(auctionItemId);
      }

      // Keep frontend consistent with backend/DB:
      // when a bid is rejected (often because another bid won the race),
      // force a snapshot refresh and bump the suggested amount to the
      // latest minimum according to the freshest data we currently have.
      const ai = auctionItems?.find((i) => i.id === auctionItemId);
      const historyHighest = bidHistory?.[auctionItemId]?.[0]?.amount;
      const apiHighest = ai ? getHighestFromApi(ai as any) : 0;
      const currentHighest =
        historyHighest !== undefined ? historyHighest : apiHighest;
      const bidIncrement = Number(auction.bidIncrement || 50000);
      const minNextBid = Number(currentHighest) + bidIncrement;

      setBidStates((prev) => {
        const current = prev[auctionItemId];
        const currentAmount = Number(current?.amount);
        const shouldBump = !Number.isFinite(currentAmount) || currentAmount < minNextBid;
        return {
          ...prev,
          [auctionItemId]: {
            ...current,
            isPending: false,
            error: reason || 'Puja rechazada',
            pendingRequestId: undefined,
            amount: shouldBump ? String(minNextBid) : current?.amount,
          },
        };
      });

      onRealtimeSnapshot?.();
    },
    [auctionItems, bidHistory, auction.bidIncrement, onRealtimeSnapshot]
  );

  useEffect(() => {
    if (!auctionItems) return;
    setBidHistory((prev) => {
      const next: ItemBidHistory = { ...prev };
      auctionItems.forEach((ai) => {
        const fromApi =
          (ai.bids || [])
            .map((b) => ({
              id: b.id,
              amount: Number(b.offered_price),
              userId: b.userId,
              userName: b.user?.public_name || 'Usuario',
              timestamp: new Date(
                b.bid_time || b.createdAt || Date.now()
              ).getTime(),
            }))
            .sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp) ||
          [];
        const existing = prev[ai.id] || [];
        const merged = [...fromApi, ...existing].reduce((acc, bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, [] as typeof fromApi);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        next[ai.id] = merged;
      });
      return next;
    });

  }, [auctionItems]);

  // Seed/refresh the current winner per item from the latest API snapshot.
  // This prevents multiple clients from showing "Ganando" simultaneously
  // if their local history temporarily diverges.
  useEffect(() => {
    if (!auctionItems) return;
    setWinnerByItemId((prev) => {
      const next: WinnerByItem = { ...prev };
      for (const ai of auctionItems) {
        const apiHighestBidder = getHighestBidderFromApi(ai);
        if (apiHighestBidder) next[ai.id] = String(apiHighestBidder);
      }
      return next;
    });
  }, [auctionItems]);


// Initialize per-item clocks (fallback to auction-level times when item times are null)
useEffect(() => {
  if (!auctionItems) return;
  setItemTimes((prev) => {
    const next: Record<string, { startTime: string | Date; endTime: string | Date }> = { ...prev };
    for (const ai of auctionItems) {
      const incomingStart = (ai as any).startTime || auction.startTime;
      const incomingEnd = (ai as any).endTime || auction.endTime;

      // IMPORTANT: timers must be monotonic.
      // Under load, multiple snapshot refetches can resolve out-of-order and bring older endTime values.
      // Never allow an incoming snapshot to move endTime backwards.
      const prevEnd = next[ai.id]?.endTime;
      const prevEndMs = prevEnd ? new Date(prevEnd as any).getTime() : 0;
      const incomingEndMs = incomingEnd ? new Date(incomingEnd as any).getTime() : 0;

      next[ai.id] = {
        startTime: next[ai.id]?.startTime || incomingStart,
        endTime:
          Number.isFinite(prevEndMs) && Number.isFinite(incomingEndMs)
            ? incomingEndMs > prevEndMs
              ? incomingEnd
              : prevEnd!
            : incomingEnd,
      };
    }
    return next;
  });
}, [auctionItems, auction.startTime, auction.endTime]);

  
  const handleTimeExtension = useCallback(
    (data: any) => {
      if (!data?.newEndTime) return;

      // Independent timer per item is REQUIRED. Only update the specific item.
      // If the payload doesn't include auctionItemId, ignore it to avoid accidentally
      // extending all items (which mixes timers and breaks the client requirement).
      if (!data?.auctionItemId) return;

      const itemId = String(data.auctionItemId);
      setItemTimes((prev) => {
        const current = prev[itemId];
        const currentEnd = current?.endTime || (auction as any).endTime;
        const currentEndMs = currentEnd
          ? new Date(currentEnd as any).getTime()
          : 0;
        const nextEndMs = new Date(data.newEndTime as any).getTime();

        // Never move the countdown backwards (ignore stale/out-of-order extensions)
        if (
          Number.isFinite(currentEndMs) &&
          Number.isFinite(nextEndMs) &&
          nextEndMs <= currentEndMs
        ) {
          return prev;
        }

        return {
          ...prev,
          [itemId]: {
            startTime: current?.startTime || auction.startTime,
            endTime: data.newEndTime,
          },
        };
      });

      // NOTE: Avoid immediate snapshot refetch here.
      // Under stress, multiple overlapping refetches can resolve out-of-order and revert timers.
    },
    [auction.startTime, auction.endTime]
  );

  const { isJoined, connectionError, sendBid, serverOffsetMs } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId,
    accessToken,
    onBidPlaced: handleBidPlaced,
    onBidRejected: handleBidRejected,
    onTimeExtension: handleTimeExtension,
    onStatusChanged: handleAuctionStatusChanged,
    onJoined: onRealtimeSnapshot,
  });

  // Shared, server-synced clock for the whole view (prevents per-item timer drift and avoids N intervals).
  const [nowMs, setNowMs] = useState(() => Date.now() + (serverOffsetMs || 0));

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const getNearestEndMs = (): number => {
      const candidates: number[] = [];

      const overall = new Date(overallEndTime as any).getTime();
      if (Number.isFinite(overall)) candidates.push(overall);

      if (auctionItems && auctionItems.length > 0) {
        for (const ai of auctionItems) {
          const endTime =
            itemTimes[ai.id]?.endTime || (ai as any).endTime || overallEndTime;
          const ms = new Date(endTime as any).getTime();
          if (Number.isFinite(ms)) candidates.push(ms);
        }
      }

      // Fallback to overall end if we can't parse anything.
      return candidates.length > 0 ? Math.min(...candidates) : Date.now();
    };

    const schedule = () => {
      // Adaptive tick:
      // - Smooth near the end (250ms)
      // - Lighter updates when far from end (1000ms)
      const offset = serverOffsetMs || 0;
      const now = Date.now() + offset;
      const nearestEndMs = getNearestEndMs();
      const remainingMs = Math.max(0, nearestEndMs - now);
      const baseTickMs = remainingMs <= 15_000 ? 100 : remainingMs <= 120_000 ? 250 : 1000;

      // Align to the tick grid to reduce visible jitter.
      const alignedDelay = Math.max(10, baseTickMs - (now % baseTickMs));

      timeout = setTimeout(() => {
        const next = Date.now() + offset;
        // Monotonic: never allow perceived server time to go backwards.
        setNowMs((prev) => (next > prev ? next : prev));
        schedule();
      }, alignedDelay);
    };

    // Prime immediate tick, then schedule.
    setNowMs((prev) => {
      const next = Date.now() + (serverOffsetMs || 0);
      return next > prev ? next : prev;
    });
    schedule();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [serverOffsetMs, overallEndTime, auctionItems, itemTimes]);

  // Show congratulations per item (independent). If an item ends earlier than others,
  // only the winning user sees the message for that item.
  const congratulatedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!auctionItems || !userId) return;

    for (const ai of auctionItems) {
      const endTime =
        itemTimes[ai.id]?.endTime || (ai as any).endTime || auction.endTime;
      const endMs = new Date(endTime as any).getTime();
      if (!Number.isFinite(endMs)) continue;

      if (nowMs < endMs) continue;
      if (congratulatedItemsRef.current.has(ai.id)) continue;

      const history = bidHistory[ai.id] || [];
      const winnerId = history[0]?.userId ?? getHighestBidderFromApi(ai);

      if (winnerId && winnerId === userId) {
        const plate = ai.item?.plate || 'este ítem';
        toast({
          title: '¡Felicitaciones! 🎉',
          description: `Ganaste el ítem ${plate}.`,
        });
      }

      congratulatedItemsRef.current.add(ai.id);
    }
  }, [auctionItems, auction.endTime, bidHistory, itemTimes, nowMs, toast, userId]);



  // If the overall auction timer reaches 0 but the backend status still hasn't swapped,
  // show a "finalizando" overlay while the router updates.
  // We use the shared nowMs (server-synced) to avoid extra intervals.
  useEffect(() => {
    if (finalizingOnceRef.current) return;

    const endMs = new Date(overallEndTime as any).getTime();
    if (!Number.isFinite(endMs)) return;

    if (nowMs >= endMs) {
      finalizingOnceRef.current = true;
      setIsFinalizingAuction(true);
      onRealtimeSnapshot?.();
    }
  }, [overallEndTime, nowMs, onRealtimeSnapshot]);
  
  
  
      // Initialize bid states
  // Rehidrata historial con lo que viene del API
  // Inicializa montos mínimos para cada item cuando llega data
  useEffect(() => {
    if (!auctionItems) return;
    setBidStates((prev) => {
      const next: BidState = { ...prev };
      auctionItems.forEach((ai) => {
        const historyHighest = bidHistory[ai.id]?.[0]?.amount;
        const apiHighest = getHighestFromApi(ai);
        const currentHighest =
          historyHighest !== undefined ? historyHighest : apiHighest;
        const bidIncrement = Number(auction.bidIncrement || 50000);
        const minNextBid = currentHighest + bidIncrement;
        if (!next[ai.id]) {
          next[ai.id] = {
            amount: minNextBid.toString(),
            isPending: false,
            error: null,
          };
        }
      });
      return next;
    });
  }, [auctionItems, bidHistory, auction.bidIncrement]);

  // Ensure suggested amount is refreshed from latest data (non-optimistic)
  useEffect(() => {
    if (!auctionItems) return;
    setBidStates((prev) => {
      const next: BidState = { ...prev };
      auctionItems.forEach((ai) => {
        const historyHighest = bidHistory[ai.id]?.[0]?.amount;
        const apiHighest = getHighestFromApi(ai);
        const currentHighest =
          historyHighest !== undefined ? historyHighest : apiHighest;
        const bidIncrement = Number(auction.bidIncrement || 50000);
        const minNextBid = currentHighest + bidIncrement;

        const prevAmount = next[ai.id]?.amount
          ? Number(next[ai.id].amount)
          : undefined;
        const shouldUpdateAmount =
          prevAmount === undefined ||
          (!next[ai.id]?.isPending && prevAmount < minNextBid);

        next[ai.id] = {
          amount: shouldUpdateAmount
            ? minNextBid.toString()
            : next[ai.id]?.amount || minNextBid.toString(),
          isPending: next[ai.id]?.isPending || false,
          error: next[ai.id]?.error || null,
          pendingRequestId: next[ai.id]?.pendingRequestId,
        };
      });
      return next;
    });
  }, [auctionItems, bidHistory, auction.bidIncrement]);

  // Place bid function
  const placeBid = (auctionItemId: string, skipSelfBidCheck = false) => {
    const bidState = bidStates[auctionItemId];
    if (!bidState || bidState.isPending) return;

    const amount = Number(bidState.amount);
    const itemHistory = bidHistory[auctionItemId] || [];
    const currentHighestBidderId =
      itemHistory[0]?.userId ||
      getHighestBidderFromApi(
        auctionItems.find(
          (i) => i.id === auctionItemId
        ) as AuctionItemWithItmeAndBidsDto
      );

    if (!skipSelfBidCheck && currentHighestBidderId === userId) {
      setSelfBidWarning({ auctionItemId, amount });
      return;
    }

    const requestId = sendBid(auctionItemId, amount);

    // If we couldn't send (WS not connected / not joined), do NOT enter pending state
    // otherwise the button can get stuck in loading forever.
    if (!requestId) {
      setBidStates((prev) => ({
        ...prev,
        [auctionItemId]: {
          ...prev[auctionItemId],
          isPending: false,
          error: 'Conexión en tiempo real no disponible. Reintenta en unos segundos.',
          pendingRequestId: undefined,
        },
      }));
      toast({
        title: 'No se pudo enviar la puja',
        description:
          'Tu conexión en tiempo real no está lista (aún no te uniste a la subasta). Reintenta.',
        variant: 'destructive',
      });
      return;
    }

    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: {
        ...prev[auctionItemId],
        isPending: true,
        error: null,
        pendingRequestId: requestId,
      },
    }));

    // Fallback: clear loading if server doesn't confirm (prevents stuck "pujando")
    if (requestId) {
      const existing = pendingBidTimeoutsRef.current.get(auctionItemId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setBidStates((prev) => {
          const state = prev[auctionItemId];
          if (!state?.isPending) return prev;
          if (state.pendingRequestId && state.pendingRequestId !== requestId) return prev;
          return {
            ...prev,
            [auctionItemId]: {
              ...state,
              isPending: false,
              error: 'No se pudo confirmar tu puja. Reintenta.',
              pendingRequestId: undefined,
            },
          };
        });
      }, 8000);

      pendingBidTimeoutsRef.current.set(auctionItemId, timeout);
    }
  };

  const confirmSelfBid = () => {
    if (selfBidWarning) {
      placeBid(selfBidWarning.auctionItemId, true);
      setSelfBidWarning(null);
    }
  };

  const updateBidAmount = (auctionItemId: string, value: string) => {
    setBidStates((prev) => ({
      ...prev,
      [auctionItemId]: {
        ...prev[auctionItemId],
        amount: value,
        error: null,
      },
    }));
  };

  const handleAutoBidToggle = (auctionItemId: string) => {
    const currentSetting = autoBidSettings[auctionItemId];
    if (currentSetting?.enabled) {
      removeAutoBidSetting(auctionItemId);
    } else {
      const itemHistory = bidHistory[auctionItemId] || [];
      const currentHighest = Number(
        itemHistory[0]?.amount ||
          auctionItems?.find((i) => i.id === auctionItemId)?.bids?.[0]
            ?.offered_price ||
          auctionItems?.find((i) => i.id === auctionItemId)?.startingBid ||
          0
      );
      const bidIncrement = Number(auction.bidIncrement || 50000);
      const minNextBid = currentHighest + bidIncrement;

      setPendingAutoBid({ auctionItemId, maxPrice: minNextBid * 2 });
    }
  };

  const confirmAutoBid = () => {
    if (pendingAutoBid) {
      updateAutoBidSetting(pendingAutoBid.auctionItemId, {
        enabled: true,
        maxPrice: pendingAutoBid.maxPrice,
      });
      setPendingAutoBid(null);
    }
  };

  const handleAutoBidMaxPriceChange = (
    auctionItemId: string,
    value: number
  ) => {
    const currentSetting = autoBidSettings[auctionItemId];
    if (currentSetting) {
      updateAutoBidSetting(auctionItemId, {
        ...currentSetting,
        maxPrice: value,
      });
    }
  };

  return (
    <div className="space-y-6">
      <AuctionFinalizingOverlay open={isFinalizingAuction} />
      <AuctionHeader
        title={auction.title}
        description={auction.description || ''}
        status="ACTIVA"
      />

      {/* <ConnectionStatus
        isConnected={isConnected}
        isJoined={isJoined}
        participantCount={participantCount}
      /> */}

      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Items Grid */}
      {auctionItems && auctionItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stableAuctionItems.map((auctionItem) => {
            const itemHistory = bidHistory[auctionItem.id] || [];
            const currentHighest = Number(
              itemHistory[0]?.amount ?? getHighestFromApi(auctionItem)
            );
            const bidIncrement = Number(auction.bidIncrement || 50000);
            const minNextBid = currentHighest + bidIncrement;
            const bidState = bidStates[auctionItem.id] || {
              amount: minNextBid.toString(),
              isPending: false,
              error: null,
              pendingRequestId: undefined,
            };
            // Use the explicit winner map first (authoritative), then fallback.
            const winnerId = winnerByItemId[auctionItem.id] ?? itemHistory[0]?.userId ?? getHighestBidderFromApi(auctionItem);
            const isUserWinning = winnerId === userId;

            return (
              <AuctionItemCard
                key={auctionItem.id}
                auctionItem={auctionItem}
                status={auction.status}
                startTime={itemTimes[auctionItem.id]?.startTime || auction.startTime}
                endTime={itemTimes[auctionItem.id]?.endTime || auction.endTime}
                serverOffsetMs={serverOffsetMs}
                nowMs={nowMs}
                currentHighest={currentHighest}
                minNextBid={minNextBid}
                bidIncrement={bidIncrement}
                isUserWinning={isUserWinning}
                bidState={bidState}
                autoBidSetting={autoBidSettings[auctionItem.id]}
                isJoined={isJoined}
                bidHistory={itemHistory}
                userId={userId}
                onBidAmountChange={(value) =>
                  updateBidAmount(auctionItem.id, value)
                }
                onPlaceBid={() => placeBid(auctionItem.id)}
                onViewDetails={() => setSelectedItemForDetail(auctionItem)}
                onAutoBidToggle={() => handleAutoBidToggle(auctionItem.id)}
                onAutoBidMaxPriceChange={(value) =>
                  handleAutoBidMaxPriceChange(auctionItem.id, value)
                }
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No hay items en esta subasta
        </p>
      )}

      {/* Dialogs */}
      <SelfBidWarningDialog
        isOpen={!!selfBidWarning}
        onConfirm={confirmSelfBid}
        onCancel={() => setSelfBidWarning(null)}
      />

      <AutoBidConfirmDialog
        isOpen={!!pendingAutoBid}
        maxPrice={pendingAutoBid?.maxPrice || 0}
        onConfirm={confirmAutoBid}
        onCancel={() => setPendingAutoBid(null)}
      />

      {selectedItemForDetail && (
        <AuctionItemDetailModal
          auctionItem={selectedItemForDetail}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentHighestBid={Number(
            bidHistory[selectedItemForDetail.id]?.[0]?.amount ??
              getHighestFromApi(selectedItemForDetail)
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          onPlaceBid={(amount) => {
            updateBidAmount(selectedItemForDetail.id, amount.toString());
            placeBid(selectedItemForDetail.id);
          }}
          isUserView={true}
          userId={userId}
          bidHistory={bidHistory[selectedItemForDetail.id] || []}
        />
      )}
    </div>
  );
}
