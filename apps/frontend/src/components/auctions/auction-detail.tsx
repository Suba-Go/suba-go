'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  Trophy,
  Edit,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@suba-go/shared-components/components/ui/dialog';
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
import { AuctionEditModal } from './auction-edit-modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import { useAuctionCancelToggle } from '@/hooks/use-auction-cancel-toggle';
import { useSession } from 'next-auth/react';
import { useAuctionWebSocketBidding } from '@/hooks/use-auction-websocket-bidding';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionStatusEnum,
  AuctionTypeEnum,
  // BidDto,
  BidWithUserDto,
  ItemStateEnum,
  UserRolesEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { ParticipantsList } from './participants-list';
import { ItemBidHistory } from './user-view/item-bid-history';
import { AuctionItemDetailModal } from './auction-item-detail-modal';

interface AuctionDetailProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  userRole: string;
  userId?: string;
  accessToken?: string;
  tenantId?: string;
  onRealtimeSnapshot?: () => void;
  primaryColor?: string;
}

export function AuctionDetail({
  auction,
  auctionItems,
  userRole,
  accessToken,
  tenantId,
  onRealtimeSnapshot,
  primaryColor,
}: AuctionDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('items');
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Apply primary color to active tabs
  useEffect(() => {
    if (!primaryColor || !tabsListRef.current) return;

    const applyStyles = () => {
      const tabs = tabsListRef.current?.querySelectorAll('[data-value]');
      if (!tabs) return;

      tabs.forEach((tab) => {
        const tabElement = tab as HTMLElement;
        const isActive = tabElement.getAttribute('data-state') === 'active';
        if (isActive) {
          tabElement.style.backgroundColor = primaryColor;
          tabElement.style.color = '#000000';
        } else {
          // Reset inactive tabs
          tabElement.style.backgroundColor = '';
          tabElement.style.color = '';
        }
      });
    };

    // Apply immediately
    applyStyles();

    // Use MutationObserver to watch for data-state changes
    const observer = new MutationObserver(() => {
      applyStyles();
    });

    if (tabsListRef.current) {
      observer.observe(tabsListRef.current, {
        attributes: true,
        attributeFilter: ['data-state'],
        subtree: true,
      });
    }

    // Also apply after delays to ensure DOM is ready
    const timer = setTimeout(applyStyles, 100);
    const timer2 = setTimeout(applyStyles, 300);
    const timer3 = setTimeout(applyStyles, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [activeTab, primaryColor]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // WebSocket state for real-time updates (AUCTION_MANAGER only)
  // IMPORTANT: do not create a manual WebSocket here. Use the shared bidding WS hook
  // which supports reconnection and token rotation.
  const effectiveAccessToken =
    ((session as any)?.tokens?.accessToken as string | undefined) ?? accessToken;

  const wsEnabled =
    userRole === UserRolesEnum.AUCTION_MANAGER &&
    !!effectiveAccessToken &&
    !!tenantId &&
    !!auction?.id &&
    auction.status !== AuctionStatusEnum.COMPLETADA;

  const {
    isConnected: isWsConnected,
    participantCount: liveParticipantCount,
    connectionError: wsConnectionError,
  } = useAuctionWebSocketBidding({
    auctionId: wsEnabled ? auction.id : '',
    tenantId: wsEnabled ? (tenantId as string) : '',
    accessToken: wsEnabled ? (effectiveAccessToken as string) : '',
    onJoined: () => {
      onRealtimeSnapshot?.();
    },
    onStatusChanged: () => {
      onRealtimeSnapshot?.();
    },
  });

  // Local type for realtime lightweight bid updates received over WebSocket
  // interface LiveBidUpdate {
  //   auctionItemId: string;
  //   amount: number;
  //   userName: string;
  //   timestamp: string;
  // }

  // const [liveBidUpdates, setLiveBidUpdates] = useState<LiveBidUpdate[]>([]);

  // Fetch participants data (only for AUCTION_MANAGER)
  const { data: participants, refetch: refetchParticipants } = useFetchData<
    UserSafeDto[]
  >({
    url: `/api/auctions/${auction.id}/participants`,
    key: ['auction-participants', auction.id],
    condition: userRole === 'AUCTION_MANAGER',
    fallbackData: [],
  });

  // Use the automatic status hook (must be called before early returns)
  const auctionStatus = useAuctionStatus(
    auction?.status || AuctionStatusEnum.PENDIENTE,
    auction?.startTime || new Date(),
    auction?.endTime || new Date()
  );

  // Optional: surface WS connection error for managers (non-blocking)
  useEffect(() => {
    if (userRole === UserRolesEnum.AUCTION_MANAGER && wsConnectionError) {
      console.warn('[AuctionDetail][WS] connectionError:', wsConnectionError);
    }
  }, [userRole, wsConnectionError]);

  const {
    checked: cancelChecked,
    isMutating: isCancelMutating,
    toggle: handleCancelToggle,
  } = useAuctionCancelToggle({
    auction,
    onUpdated: onRealtimeSnapshot,
  });

  // Reactivation countdown (only relevant when the auction is CANCELADA).
  const [nowMs, setNowMs] = useState(() => Date.now());
  const startTimeMs = useMemo(() => {
    const v = auction.startTime as unknown as string | Date;
    const ms = typeof v === 'string' ? Date.parse(v) : v?.getTime?.();
    return Number.isFinite(ms) ? (ms as number) : null;
  }, [auction.startTime]);

  useEffect(() => {
    if (!cancelChecked) return;
    if (auction.type === AuctionTypeEnum.TEST) return;
    if (!startTimeMs) return;
    if (startTimeMs <= Date.now()) return;

    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cancelChecked, startTimeMs, auction.type]);

  const reactivateRemainingMs = useMemo(() => {
    if (!startTimeMs) return null;
    return Math.max(0, startTimeMs - nowMs);
  }, [startTimeMs, nowMs]);

  const canUncancel =
    auction.type === AuctionTypeEnum.TEST ||
    (reactivateRemainingMs !== null && reactivateRemainingMs > 0);

  // Requirement: when an auction is CANCELADA and the reactivation timer already ended
  // (i.e. it can no longer be "uncancelled"), the "Editar Subasta" button must be blocked.
  // We align the edit button rule to the same timer used by the cancel/uncancel widget.
  const isEditBlocked =
    auction.status === AuctionStatusEnum.CANCELADA && !canUncancel;

  const getStatusBadge = () => {
    return (
      <Badge
        className={`${getAuctionBadgeColor(
          auctionStatus.displayStatus
        )} text-sm`}
      >
        {getAuctionStatusLabel(auctionStatus.displayStatus)}
      </Badge>
    );
  };

  const totalItems = auctionItems?.length || 0;
  const totalBids =
    auctionItems?.reduce(
      (sum: number, item) => sum + (item.bids?.length || 0),
      0
    ) || 0;
  const totalParticipants = new Set(
    auctionItems?.flatMap((item) => item.bids?.map((bid) => bid.userId) || [])
  ).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {auction.title}
            </h1>
            {getStatusBadge()}
            {/* WebSocket connection indicator for AUCTION_MANAGER */}
            {userRole === 'AUCTION_MANAGER' && isWsConnected && (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                En vivo
              </Badge>
            )}
            {userRole === 'AUCTION_MANAGER' &&
              !isWsConnected &&
              accessToken && (
                <Badge variant="outline" className="gap-1">
                  <WifiOff className="h-3 w-3 text-gray-400" />
                  Sin conexión
                </Badge>
              )}
          </div>
          {auction.description && (
            <p className="text-gray-600">{auction.description}</p>
          )}
        </div>

        {/* Action buttons for auction managers */}
        {userRole === 'AUCTION_MANAGER' && (
          <div className="flex items-center gap-4 md:flex-shrink-0 order-3 md:order-2">
            {/* Show message for completed auctions */}
            {auction.status === 'COMPLETADA' ? (
              <Button
                variant="outline"
                onClick={() => setShowCompletedDialog(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Subasta
              </Button>
            ) : (
              <>
                {/* Edit button - only show if auction is PENDIENTE or CANCELADA */}
                {(auction.status === AuctionStatusEnum.PENDIENTE ||
                  auction.status === AuctionStatusEnum.CANCELADA) && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    disabled={isEditBlocked}
                    title={
                      isEditBlocked
                        ? 'No se puede editar una subasta cancelada cuyo tiempo ya finalizó.'
                        : undefined
                    }
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Subasta
                  </Button>
                )}

                {/* Cancel switch - only show if auction is PENDIENTE, CANCELADA, or TEST */}
                {(auction.status === AuctionStatusEnum.PENDIENTE ||
                  auction.status === AuctionStatusEnum.CANCELADA ||
                  auction.type === AuctionTypeEnum.TEST) && (
                  <div
                    // When active (not cancelled), use the tenant primary color so it looks like a
                    // primary action and is easy to spot. When cancelled, keep the red warning style.
                    style={
                      !cancelChecked && primaryColor
                        ? { backgroundColor: primaryColor }
                        : undefined
                    }
                    className={`rounded-lg border p-3 w-full md:w-auto md:min-w-[340px] ${
                      cancelChecked
                        ? 'border-red-200 bg-red-50'
                        : primaryColor
                          ? 'border-white/20 text-white shadow-sm'
                          : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${
                            cancelChecked
                              ? 'text-red-600'
                              : primaryColor
                                ? 'text-white/90'
                                : 'text-amber-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <Label
                            htmlFor="cancel-auction"
                            className={`cursor-pointer font-medium ${
                              cancelChecked
                                ? 'text-gray-900'
                                : primaryColor
                                  ? 'text-white'
                                  : 'text-gray-900'
                            }`}
                          >
                            Cancelar subasta
                          </Label>

                          {cancelChecked &&
                            auction.type !== AuctionTypeEnum.TEST && (
                              <p className="text-xs text-gray-600 mt-1">
                                {canUncancel && reactivateRemainingMs !== null
                                  ? `Puedes reactivarla con un countdown del tiempo inicial de esa subasta: ${formatCountdown(reactivateRemainingMs)}`
                                  : 'El tiempo para reactivarla ya pasó.'}
                              </p>
                            )}
                        </div>
                      </div>

                      <Switch
                        id="cancel-auction"
                        checked={cancelChecked}
                        disabled={
                          isCancelMutating || (cancelChecked && !canUncancel)
                        }
                        onCheckedChange={handleCancelToggle}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialog for completed auctions */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subasta Completada</DialogTitle>
            <DialogDescription>
              Una subasta completada no puede ser editada, cancelada o
              eliminada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowCompletedDialog(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note: We intentionally avoid a single "cronómetro grande" at the top.
          Each item has its own independent timer to prevent confusion. */}

      {/* Countdown Timer for Upcoming Auctions */}
      {auctionStatus.isPending && auctionStatus.timeRemainingDetailed && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">
                  Subasta Programada - Inicia en:
                </h3>
                <div className="flex gap-4 text-2xl font-bold text-blue-700">
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.hours
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-blue-600">
                      horas
                    </span>
                  </div>
                  <span className="text-blue-600">:</span>
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.minutes
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-blue-600">
                      minutos
                    </span>
                  </div>
                  <span className="text-blue-600">:</span>
                  <div className="flex flex-col items-center">
                    <span>
                      {String(
                        auctionStatus.timeRemainingDetailed.seconds
                      ).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-normal text-blue-600">
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
            <div className="text-2xl font-bold text-blue-600">
              {typeof totalBids === 'number' ? totalBids : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              Participantes
              {isWsConnected && liveParticipantCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {liveParticipantCount} en línea
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalParticipants}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          ref={tabsListRef}
          className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg"
        >
          <TabsTrigger
            value="items"
            className="data-[state=active]:text-black data-[state=active]:shadow-sm font-medium transition-all"
          >
            📦 Items de Subasta
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="data-[state=active]:text-black data-[state=active]:shadow-sm font-medium transition-all"
          >
            👥 Participantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {auctionItems && auctionItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {auctionItems.map(
                (auctionItem: AuctionItemWithItmeAndBidsDto) => {
                  const topBid =
                    auctionItem.bids && auctionItem.bids.length > 0
                      ? auctionItem.bids.reduce(
                          (prev: BidWithUserDto | null, b: BidWithUserDto) => {
                            if (!prev) return b;
                            return Number(b.offered_price) >
                              Number(prev.offered_price)
                              ? b
                              : prev;
                          },
                          null as unknown as BidWithUserDto
                        )
                      : null;

                  const isAdjudicated =
                    auctionItem.item?.state === ItemStateEnum.VENDIDO ||
                    Boolean(auctionItem.item?.soldToUserId) ||
                    Boolean(auctionItem.item?.soldToUser) ||
                    Boolean(auctionItem.item?.soldPrice);

                  const winnerLabel = isAdjudicated ? 'Ganado:' : 'Ganando:';
                  return (
                    <Card
                      key={auctionItem.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedItemForDetail(auctionItem)}
                    >
                      {/* Item Image */}
                      {auctionItem.item?.photos && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                          <Image
                            src={auctionItem.item.photos.split(',')[0]?.trim()}
                            alt={`${auctionItem.item.brand} ${auctionItem.item.model}`}
                            fill
                            className="object-cover"
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
                          <h3 className="font-semibold text-lg">
                            {auctionItem.item?.plate || 'Sin Patente'}
                          </h3>
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
                                      ...auctionItem.bids.map(
                                        (bid: BidWithUserDto) =>
                                          Number(bid.offered_price)
                                      )
                                    ).toLocaleString()}
                                  </p>
                                  {topBid && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {winnerLabel}{' '}
                                      <span className="font-medium text-gray-900">
                                        {topBid.user?.public_name || 'Usuario'}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>

                          {auctionItem.bids && auctionItem.bids.length > 0 && (
                            <>
                              <p className="text-xs text-gray-500 pt-1">
                                {auctionItem.bids.length} puja(s) realizadas
                              </p>
                              <ItemBidHistory
                                bids={auctionItem.bids || []}
                                maxItems={5}
                              />
                            </>
                          )}

                          {/* Sale Status Badge - Only show for completed auctions */}
                          {auction?.status === AuctionStatusEnum.COMPLETADA && (
                            <div className="pt-3 border-t mt-3">
                              {auctionItem.item?.state ===
                                ItemStateEnum.VENDIDO &&
                              auctionItem.item?.soldPrice ? (
                                <div className="space-y-2">
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    ✓ Vendido
                                  </Badge>
                                  <div className="text-sm">
                                    <p className="text-gray-600">
                                      Precio de venta:{' '}
                                      <span className="font-semibold text-green-700">
                                        $
                                        {Number(
                                          auctionItem.item.soldPrice
                                        ).toLocaleString()}
                                      </span>
                                    </p>
                                    {auctionItem.item.soldToUser && (
                                      <p className="text-gray-600">
                                        Comprador:{' '}
                                        <span className="font-semibold text-gray-900">
                                          {userRole === 'AUCTION_MANAGER' ||
                                          userRole === 'ADMIN'
                                            ? auctionItem.item.soldToUser
                                                .name ||
                                              auctionItem.item.soldToUser
                                                .public_name ||
                                              'Usuario'
                                            : auctionItem.item.soldToUser
                                                .public_name || 'Usuario'}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary">Sin ofertas</Badge>
                              )}
                            </div>
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
                <p className="text-gray-600">
                  Los items serán agregados antes del inicio de la subasta
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantsList
            auction={auction}
            participants={participants || []}
            isManager={userRole === 'AUCTION_MANAGER'}
            onRefresh={() => {
              refetchParticipants();
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <AuctionEditModal
        auction={auction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          // If this view is used with client-side cached data (SWR), we need
          // to explicitly refetch so the updated items appear immediately.
          onRealtimeSnapshot?.();
          // Fallback (harmless when unused) to refresh any server components.
          router.refresh();
        }}
      />

      {/* Item Detail Modal (read-only for manager) */}
      {selectedItemForDetail && (
        <AuctionItemDetailModal
          auctionItem={selectedItemForDetail}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentHighestBid={Number(
            selectedItemForDetail.bids?.[0]?.offered_price ||
              selectedItemForDetail.startingBid ||
              0
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          isUserView={false}
          showBidHistory={true}
        />
      )}
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
