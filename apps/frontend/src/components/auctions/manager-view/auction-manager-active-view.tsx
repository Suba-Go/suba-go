'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Wifi, WifiOff, Trophy } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@suba-go/shared-components/components/ui/tabs';
import { useFetchData } from '@/hooks/use-fetch-data';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import {
  useAuctionWebSocketBidding,
  BidData,
} from '@/hooks/use-auction-websocket-bidding';
import { useLiveAccessToken } from '@/hooks/use-live-access-token';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  BidWithUserDto,
  ItemStateEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { ParticipantsList } from '../participants-list';
import { ItemBidHistory } from '../user-view/item-bid-history';
import { CountdownTimer } from '../countdown-timer';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { ItemCreateModal } from '@/components/items/item-create-modal';

interface BidHistoryItem {
  id: string;
  amount: number;
  userId: string;
  userName: string;
  /** When available (e.g. from initial HTTP load), keep the full user object so manager can always show real names. */
  user?: {
    name?: string | null;
    email?: string | null;
    public_name?: string | null;
  } | null;
  timestamp: number;
}

interface ItemBidData {
  [auctionItemId: string]: BidHistoryItem[];
}

interface AuctionManagerActiveViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  accessToken: string;
  tenantId: string;
  onRealtimeSnapshot?: () => void;

  primaryColor?: string;
}

export function AuctionManagerActiveView({
  auction,
  auctionItems,
  accessToken,
  tenantId,
  onRealtimeSnapshot,
  primaryColor,
}: AuctionManagerActiveViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Keep a fresh access token while the manager stays on the live view.
  const liveAccessToken = useLiveAccessToken(accessToken) ?? accessToken;
  const [activeTab, setActiveTab] = useState('items');
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // AUCTION_MANAGER should see real bidder names (fallback to email)
  const getRealUserLabel = (u?: {
    name?: string | null;
    email?: string | null;
    public_name?: string | null;
  } | null) => u?.name || u?.email || u?.public_name || 'Usuario';
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);

  // Local state for bids to handle real-time updates
  // IMPORTANT:
  // - `bidHistory` is a *preview* (top N bids) for UI rendering.
  // - `bidCounts` is the authoritative count used for the "Total Pujas" card
  //   and per-item "X puja(s) realizadas".
  // This avoids a nasty bug where we keep only the last/top 10 bids for UI
  // and accidentally make the totals go *down* when a new bid arrives.
  const [bidHistory, setBidHistory] = useState<ItemBidData>({});
  const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
  const seenBidIdsRef = useRef<Set<string>>(new Set());

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

  // Per-item clock (independent timers / soft-close)
  const [itemTimes, setItemTimes] = useState<Record<string, { startTime: string | Date; endTime: string | Date }>>({});


  // Overall auction end time for the top banner countdown.
  // IMPORTANT: With soft-close per-item timers, the auction must be considered active until
  // ALL items finish. We therefore derive the banner endTime as the maximum of:
  // - auction.endTime (overall end)
  // - each auction_item.endTime (which can be extended to +30s on bids)
  // This prevents the manager UI from showing the auction as finished while items are still active.
  const auctionEndTime = useMemo(() => {
    const baseMs = new Date(auction.endTime as any).getTime();
    let maxMs = Number.isFinite(baseMs) ? baseMs : 0;
    for (const v of Object.values(itemTimes)) {
      const ms = new Date((v?.endTime ?? auction.endTime) as any).getTime();
      if (Number.isFinite(ms)) maxMs = Math.max(maxMs, ms);
    }
    return new Date(maxMs || Date.now());
  }, [auction.endTime, itemTimes]);

  // Server/client clock offset (ms). Updated from WebSocket JOINED message.
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Fetch participants
  const { data: participants, refetch: refetchParticipants } = useFetchData<
    UserSafeDto[]
  >({
    url: `/api/auctions/${auction.id}/participants`,
    key: ['auction-participants', auction.id],
    condition: true,
    fallbackData: [],
  });

  // NOTE: auctionStatus is computed after the shared nowMs is initialized (to keep all timers perfectly consistent).

  // Initialize bid history from props
  useEffect(() => {
    if (!auctionItems) return;
    // 1) Update seen IDs + bid counts (monotonic)
    setBidCounts((prevCounts) => {
      const nextCounts: Record<string, number> = { ...prevCounts };
      for (const ai of auctionItems) {
        const itemId = String(ai.id);
        const apiBids = ai.bids || [];
        // Track all IDs we already know about (for dedupe on realtime)
        for (const b of apiBids) {
          if (b?.id) seenBidIdsRef.current.add(String(b.id));
        }
        const apiCount = apiBids.length;
        const current = nextCounts[itemId] ?? 0;
        // Never decrease the count when we receive a smaller snapshot
        // (e.g. if the backend changes to pagination in the future).
        nextCounts[itemId] = Math.max(current, apiCount);
      }
      return nextCounts;
    });

    // 2) Build UI preview (top 10 bids per item)
    setBidHistory((prev) => {
      const next: ItemBidData = { ...prev };
      for (const ai of auctionItems) {
        const itemId = String(ai.id);
        const fromApi: BidHistoryItem[] = (ai.bids || [])
          .map((b) => ({
            id: String(b.id),
            amount: Number(b.offered_price),
            userId: String(b.userId),
            userName: getRealUserLabel((b as any)?.user) || 'Usuario',
            user: (b as any)?.user ?? null,
            timestamp: new Date(b.bid_time || b.createdAt || Date.now()).getTime(),
          }))
          .sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);

        const existing = prev[itemId] || [];
        const merged = [...fromApi, ...existing].reduce((acc: BidHistoryItem[], bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, []);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        next[itemId] = merged.slice(0, 10);
      }
      return next;
    });
  }, [auctionItems]);

  // WebSocket Handlers
  const handleBidPlaced = useCallback(
    (data: BidData) => {
      const {
        auctionItemId,
        amount,
        userId: bidderId,
        userName,
        bidId,
        timestamp,
      } = data;

      const normalizedBidId = String(bidId);
      const normalizedItemId = String(auctionItemId);

      // 1) Increment authoritative counters exactly once per bid ID
      if (!seenBidIdsRef.current.has(normalizedBidId)) {
        seenBidIdsRef.current.add(normalizedBidId);
        setBidCounts((prevCounts) => ({
          ...prevCounts,
          [normalizedItemId]: (prevCounts[normalizedItemId] ?? 0) + 1,
        }));
      }

      // 2) Update UI preview (top 10)
      setBidHistory((prev) => {
        const current = prev[normalizedItemId] || [];
        const incoming: BidHistoryItem = {
          id: normalizedBidId,
          amount,
          userId: String(bidderId),
          userName: userName || 'Usuario',
          // For WS events we only get a display string. Keep it as `name` so manager label stays stable.
          user: userName ? { name: userName, email: null, public_name: null } : null,
          timestamp,
        };
        const merged = [incoming, ...current].reduce((acc: BidHistoryItem[], bid) => {
          if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
          return acc;
        }, []);
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        return {
          ...prev,
          [normalizedItemId]: merged.slice(0, 10),
        };
      });

      // Find the item details from the auctionItems list
      const item = auctionItems.find((i) => String(i.id) === normalizedItemId)?.item;
      const itemDescription = item
        ? `${item.brand} ${item.model || ''} - ${item.plate}`.trim()
        : `Item #${normalizedItemId.slice(-4)}`;

      toast({
        title: 'Nueva puja recibida',
        description: (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{userName || 'Usuario'}</span>
            <span>
              ofertó{' '}
              {amount.toLocaleString('es-CL', {
                style: 'currency',
                currency: 'CLP',
              })}
            </span>
            <span className="text-xs text-muted-foreground">
              por {itemDescription}
            </span>
          </div>
        ),
        duration: 6000,
      });

      refetchParticipants();
    },
    [refetchParticipants, toast, auctionItems]
  );

  const handleTimeExtension = useCallback(
    (data: any) => {
      if (!data?.newEndTime) return;

      const nextEndMs = new Date(data.newEndTime as any).getTime();
      if (!Number.isFinite(nextEndMs)) return;

      if (data?.auctionItemId) {
        const itemId = String(data.auctionItemId);
        setItemTimes((prev) => {
          const current = prev[itemId];
          const currentEnd = current?.endTime || (auction as any).endTime;
          const currentEndMs = currentEnd
            ? new Date(currentEnd as any).getTime()
            : 0;

          // Never move the countdown backwards (ignore stale/out-of-order extensions)
          if (Number.isFinite(currentEndMs) && nextEndMs <= currentEndMs) {
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
      } else {
        setItemTimes((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            const curEnd = next[key]?.endTime || (auction as any).endTime;
            const curEndMs = curEnd ? new Date(curEnd as any).getTime() : 0;
            if (Number.isFinite(curEndMs) && nextEndMs <= curEndMs) continue;
            next[key] = { ...next[key], endTime: data.newEndTime };
          }
          return next;
        });
      }

      // No need to manually update the banner endTime here.
      // auctionEndTime is derived from itemTimes (max endTime) via useMemo.

      // NOTE: Avoid immediate snapshot refetch here.
      // Under stress, multiple overlapping refetches can resolve out-of-order and revert timers.
    },
    [auction.startTime, auction.endTime]
  );

  const { isConnected, participantCount, serverOffsetMs: wsServerOffsetMs } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId: tenantId || '',
    accessToken: liveAccessToken || '',
    onBidPlaced: handleBidPlaced,
    onTimeExtension: handleTimeExtension,
    onStatusChanged: () => {
      // When the backend switches to COMPLETADA, refetch snapshot data so the router swaps
      // the view for everyone in real-time.
      onRealtimeSnapshot?.();
    },
    onJoined: onRealtimeSnapshot,
  });

  useEffect(() => {
    setServerOffsetMs(wsServerOffsetMs);
  }, [wsServerOffsetMs]);

  // Shared, server-synced clock for consistent per-item timers (avoids N intervals).
  const [nowMs, setNowMs] = useState(() => Date.now() + (wsServerOffsetMs || 0));

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const getNearestEndMs = (): number => {
      const candidates: number[] = [];

      const overall = new Date(auction.endTime as any).getTime();
      if (Number.isFinite(overall)) candidates.push(overall);

      if (auctionItems && auctionItems.length > 0) {
        for (const ai of auctionItems) {
          const endTime =
            itemTimes[ai.id]?.endTime || (ai as any).endTime || auction.endTime;
          const ms = new Date(endTime as any).getTime();
          if (Number.isFinite(ms)) candidates.push(ms);
        }
      }

      return candidates.length > 0 ? Math.min(...candidates) : Date.now();
    };

    const schedule = () => {
      // Adaptive tick:
      // - Smooth near the end (250ms)
      // - Lighter updates when far from end (1000ms)
      const offset = wsServerOffsetMs || 0;
      const now = Date.now() + offset;
      const nearestEndMs = getNearestEndMs();
      const remainingMs = Math.max(0, nearestEndMs - now);
      const baseTickMs = remainingMs <= 15_000 ? 100 : remainingMs <= 120_000 ? 250 : 1000;

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
      const next = Date.now() + (wsServerOffsetMs || 0);
      return next > prev ? next : prev;
    });
    schedule();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [wsServerOffsetMs, auction.endTime, auctionItems, itemTimes]);

  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auctionEndTime,
    { serverOffsetMs, nowMs }
  );


  // Initialize per-item clocks (fallback to auction-level times when item times are null)
  useEffect(() => {
    if (!auctionItems) return;
    setItemTimes((prev) => {
      const next: Record<string, { startTime: string | Date; endTime: string | Date }> = { ...prev };
      for (const ai of auctionItems) {
        const incomingStart = (ai as any).startTime || auction.startTime;
        const incomingEnd = (ai as any).endTime || auction.endTime;

        // IMPORTANT: timers must be monotonic.
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


  // Calculate totals based on real-time data
  const totalItems = auctionItems?.length || 0;

  const totalBids = useMemo((): number => {
    return Object.values(bidCounts).reduce((acc, n) => acc + (Number(n) || 0), 0);
  }, [bidCounts]);

  const displayItems = useMemo(() => {
    return stableAuctionItems.map((item) => {
      const history = bidHistory[item.id] || [];
      const realTimeBids = history.map(
        (h: BidHistoryItem) =>
          ({
            id: h.id,
            offered_price: h.amount,
            userId: h.userId,
            bid_time: new Date(h.timestamp),
            user: h.user ?? { public_name: h.userName, name: null, email: null },
          } as any)
      );

      return {
        ...item,
        bids: realTimeBids.length > 0 ? realTimeBids : item.bids,
      };
    });
  }, [auctionItems, bidHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {auction.title}
            </h1>
            <Badge
              className={`${getAuctionBadgeColor(
                auctionStatus.displayStatus
              )} text-xs sm:text-sm`}
            >
              {getAuctionStatusLabel(auctionStatus.displayStatus)}
            </Badge>

            {isConnected ? (
              <Badge variant="outline" className="gap-1 text-xs">
                <Wifi className="h-3 w-3 text-green-600" />
                En vivo
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs">
                <WifiOff className="h-3 w-3 text-gray-400" />
                Sin conexión
              </Badge>
            )}
          </div>
          {auction.description && (
            <p className="text-gray-600">{auction.description}</p>
          )}
        </div>
      </div>

      {/* Countdown */}
      {auctionStatus.timeRemainingDetailed && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-2">
                  Subasta Activa - Termina en:
                </h3>
                <div className="flex gap-3 sm:gap-4 text-xl sm:text-2xl font-bold text-green-700">
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.hours
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-green-600">
                      horas
                    </span>
                  </div>
                  <span className="text-green-600">:</span>
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.minutes
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-green-600">
                      minutos
                    </span>
                  </div>
                  <span className="text-green-600">:</span>
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.seconds
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-green-600">
                      segundos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pujas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalBids}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              Participantes
              {isConnected && participantCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {participantCount} en línea
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {participants?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="items"
            className="text-black data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all"
            style={
              activeTab === 'items' && primaryColor
                ? {
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }
                : undefined
            }
          >
            📦 Items de Subasta
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="text-black data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all"
            style={
              activeTab === 'participants' && primaryColor
                ? {
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }
                : undefined
            }
          >
            👥 Participantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {displayItems && displayItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayItems.map(
                (auctionItem: AuctionItemWithItmeAndBidsDto) => {
                  const topBid =
                    auctionItem.bids && auctionItem.bids.length > 0
                      ? auctionItem.bids.reduce((prev: any, b: any) => {
                          if (!prev) return b;
                          return Number(b.offered_price) >
                            Number(prev.offered_price)
                            ? b
                            : prev;
                        }, null)
                      : null;

                  return (
                    <Card
                      key={auctionItem.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedItemForDetail(auctionItem)}
                    >
                      {auctionItem.item?.photos && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                          <SafeImage
                            src={auctionItem.item.photos.split(',')[0]?.trim()}
                            alt={`${auctionItem.item.brand} ${auctionItem.item.model}`}
                            fill
                            className="object-cover"
                            // This view is rendered as 1 column on <lg and 2 columns on >=lg.
                            // Using 33vw here causes Next/Image to request a too-small variant on desktop,
                            // resulting in noticeable blur when the card is ~50% width.
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            quality={82}
/>
                        </div>
                      )}

                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-lg">
                              {auctionItem.item?.plate || 'Sin Patente'}
                            </h3>
                            <CountdownTimer
                              status={auction.status}
                              startTime={itemTimes[auctionItem.id]?.startTime || auction.startTime}
                              endTime={itemTimes[auctionItem.id]?.endTime || auction.endTime}
                              serverOffsetMs={serverOffsetMs}
                              nowMs={nowMs}
                              variant="compact"
                              className="px-2 py-1 rounded bg-gray-50"
                            />
                          </div>
                          <p className="text-sm text-gray-600">
                            {auctionItem.item?.brand} {auctionItem.item?.model}{' '}
                            {auctionItem.item?.year}
                          </p>

                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <p className="text-xs text-gray-500">
                                Puja inicial
                              </p>
                              <p className="font-semibold text-green-600">
                                $
                                {Number(
                                  auctionItem.startingBid
                                ).toLocaleString()}
                              </p>
                            </div>

                            {auctionItem.bids &&
                              auctionItem.bids.length > 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    Puja más alta
                                  </p>
                                  <p className="font-semibold text-blue-600">
                                    $
                                    {Math.max(
                                      ...auctionItem.bids.map((bid: any) =>
                                        Number(bid.offered_price)
                                      )
                                    ).toLocaleString()}
                                  </p>
                                  {topBid &&
                                        (() => {
                                          const itemEndTime =
                                            itemTimes[auctionItem.id]?.endTime || auction.endTime;

                                          const isTimerFinished = nowMs >= new Date(itemEndTime).getTime();

                                          const isSold = auctionItem.item?.state === ItemStateEnum.VENDIDO;

                                          const winnerLabel =
                                            isSold || isTimerFinished ? 'Ganador/a:' : 'Ganando:';

                                          return (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {winnerLabel}{' '}
                                              <span className="font-medium text-gray-900">
                                                {getRealUserLabel(topBid.user as any)}
                                              </span>
                                            </p>
                                          );
                                        })()}
                                </div>
                              )}
                          </div>

                          {auctionItem.bids && auctionItem.bids.length > 0 && (
                            <>
                              <p className="text-xs text-gray-500 pt-1">
                                {(bidCounts[String(auctionItem.id)] ?? auctionItem.bids.length)} puja(s) realizadas
                              </p>
                              <ItemBidHistory
                                bids={auctionItem.bids as BidWithUserDto[]}
                                maxItems={5}
                                showRealNames
                              />
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay items en esta subasta
                </h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantsList
            auction={auction}
            participants={participants || []}
            isManager={true}
            onRefresh={refetchParticipants}
            primaryColor={primaryColor}
          />
        </TabsContent>
      </Tabs>

      {/* Item Detail Modal (read-only for manager) */}
      {selectedItemForDetail && (
        <AuctionItemDetailModal
          auctionItem={selectedItemForDetail}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentHighestBid={Number(
            bidHistory[selectedItemForDetail.id]?.[0]?.amount ??
              selectedItemForDetail.bids?.[0]?.offered_price ??
              selectedItemForDetail.startingBid ??
              0
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          isUserView={false}
          showBidHistory={true}
          showBidderRealNames={true}
          bidHistory={bidHistory[selectedItemForDetail.id] || []}
        />
      )}

      {/* Create Item Modal */}
      <ItemCreateModal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        onSuccess={() => {
          setIsCreateItemModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
