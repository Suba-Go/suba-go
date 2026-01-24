'use client';

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
import Image from 'next/image';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import {
  useAuctionWebSocketBidding,
  BidData,
} from '@/hooks/use-auction-websocket-bidding';
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
  const [bidHistory, setBidHistory] = useState<ItemBidData>({});

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


  // Server-authoritative end time (can be extended via soft-close)
  const [auctionEndTime, setAuctionEndTime] = useState<string | Date>(auction.endTime);

  useEffect(() => {
    setAuctionEndTime(auction.endTime);
  }, [auction.endTime]);

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

  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auctionEndTime,
    { serverOffsetMs }
  );

  // Initialize bid history from props
  useEffect(() => {
    if (!auctionItems) return;
    setBidHistory((prev) => {
      const next: ItemBidData = { ...prev };
      auctionItems.forEach((ai) => {
        const fromApi: BidHistoryItem[] =
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
        // Merge ensuring uniqueness by ID
        const merged = [...fromApi, ...existing].reduce(
          (acc: BidHistoryItem[], bid) => {
            if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
            return acc;
          },
          []
        );
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
        next[ai.id] = merged;
      });
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

      setBidHistory((prev) => {
        const current = prev[auctionItemId] || [];
        const incoming: BidHistoryItem = {
          id: bidId,
          amount,
          userId: bidderId,
          userName: userName || 'Usuario',
          timestamp,
        };
        const merged = [incoming, ...current].reduce(
          (acc: BidHistoryItem[], bid) => {
            if (!acc.find((x) => x.id === bid.id)) acc.push(bid);
            return acc;
          },
          []
        );
        merged.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);

        return {
          ...prev,
          [auctionItemId]: merged.slice(0, 10),
        };
      });

      toast({
        title: 'Nueva puja recibida',
        description: `${
          userName || 'Usuario'
        } pujó $${amount.toLocaleString()}`,
      });

      refetchParticipants();
    },
    [refetchParticipants, toast]
  );

  const handleTimeExtension = useCallback(
    (data: any) => {
      if (!data?.newEndTime) return;

      if (data?.auctionItemId) {
        const itemId = String(data.auctionItemId);
        setItemTimes((prev) => {
          const current = prev[itemId];
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
            next[key] = { ...next[key], endTime: data.newEndTime };
          }
          return next;
        });
      }

      onRealtimeSnapshot?.();
    },
    [onRealtimeSnapshot, auction.startTime]
  );

  const { isConnected, participantCount, serverOffsetMs: wsServerOffsetMs } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId: tenantId || '',
    accessToken: accessToken || '',
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
    const tick = () => setNowMs(Date.now() + (wsServerOffsetMs || 0));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [wsServerOffsetMs]);


  // Initialize per-item clocks (fallback to auction-level times when item times are null)
  useEffect(() => {
    if (!auctionItems) return;
    setItemTimes((prev) => {
      const next: Record<string, { startTime: string | Date; endTime: string | Date }> = { ...prev };
      for (const ai of auctionItems) {
        next[ai.id] = {
          startTime: (ai as any).startTime || auction.startTime,
          endTime: (ai as any).endTime || auction.endTime,
        };
      }
      return next;
    });
  }, [auctionItems, auction.startTime, auction.endTime]);


  // Calculate totals based on real-time data
  const totalItems = auctionItems?.length || 0;

  const totalBids = useMemo((): number => {
    return Object.values(bidHistory).reduce(
      (acc, bids) => acc + bids.length,
      0
    );
  }, [bidHistory]);

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
            user: { public_name: h.userName },
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
                          <Image
                            src={auctionItem.item.photos.split(',')[0]?.trim()}
                            alt={`${auctionItem.item.brand} ${auctionItem.item.model}`}
                            fill
                            className="object-cover"
                            // This view is rendered as 1 column on <lg and 2 columns on >=lg.
                            // Using 33vw here causes Next/Image to request a too-small variant on desktop,
                            // resulting in noticeable blur when the card is ~50% width.
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            quality={82}
                            onError={(e) => {
                              const target =
                                e.currentTarget as HTMLImageElement;
                              target.src =
                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTQwSDYwVjgwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                            }}
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
                                {auctionItem.bids.length} puja(s) realizadas
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
