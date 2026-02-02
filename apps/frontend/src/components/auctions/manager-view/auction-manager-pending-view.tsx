'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Calendar, Edit, Trophy } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { Label } from '@suba-go/shared-components/components/ui/label';
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
import { useAuctionWebSocketBidding } from '@/hooks/use-auction-websocket-bidding';
import { useLiveAccessToken } from '@/hooks/use-live-access-token';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { AuctionEditModal } from '../auction-edit-modal';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import { useAuctionCancelToggle } from '@/hooks/use-auction-cancel-toggle';
import { AuctionStartingOverlay } from '../auction-starting-overlay';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionStatusEnum,
  AuctionTypeEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { ParticipantsList } from '../participants-list';

function formatMsToHhMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
}
import { AuctionItemDetailModal } from '../auction-item-detail-modal';

interface AuctionManagerPendingViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  accessToken: string;
  tenantId: string;
  primaryColor?: string;
  /**
   * When the backend status changes (e.g., PENDIENTE -> ACTIVA, ACTIVA -> COMPLETADA),
   * refetch snapshot data in the parent so the view router can switch components.
   */
  onRealtimeSnapshot?: () => void;
}

export function AuctionManagerPendingView({
  auction,
  auctionItems,
  accessToken,
  tenantId,
  primaryColor,
  onRealtimeSnapshot,
}: AuctionManagerPendingViewProps) {
  const router = useRouter();
  const liveAccessToken = useLiveAccessToken(accessToken) ?? accessToken;
  const [activeTab, setActiveTab] = useState('items');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // Server/client clock offset (ms). Updated from WebSocket JOINED message.
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Fetch participants data
  const { data: participants, refetch: refetchParticipants } = useFetchData<
    UserSafeDto[]
  >({
    url: `/api/auctions/${auction.id}/participants`,
    key: ['auction-participants', auction.id],
    condition: true,
    fallbackData: [],
  });

  const { connectionError, serverOffsetMs: wsServerOffsetMs } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId,
    accessToken: liveAccessToken,
    onStatusChanged: () => {
      // Status changed on backend; let parent refetch and route to the correct view.
      onRealtimeSnapshot?.();
    },
    onJoined: onRealtimeSnapshot,
  });

  useEffect(() => {
    setServerOffsetMs(wsServerOffsetMs);
  }, [wsServerOffsetMs]);

  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auction.endTime,
    { serverOffsetMs }
  );

  const nowMs = auctionStatus.nowMs;

  // NOTE: Edit button blocking depends on the reactivation timer (startTime countdown),
  // so it is computed after `canUncancel` is derived below.

  // NOTE: We intentionally do NOT compute a boolean based on Date.now() here, because this component
  // may not re-render at the exact second needed. The overlay itself runs an internal clock and decides
  // when to appear.

  const {
    checked: cancelChecked,
    isMutating: isCancelMutating,
    toggle: handleCancelToggle,
  } = useAuctionCancelToggle({
    auction,
    // Refresh only the needed snapshot data (fast) instead of router.refresh() (heavy).
    onUpdated: onRealtimeSnapshot,
  });

  // Reactivation countdown (only relevant when the auction is CANCELADA).
  const startTimeMs = useMemo(() => {
    const v = auction.startTime as unknown as string | Date;
    const ms = typeof v === 'string' ? Date.parse(v) : v?.getTime?.();
    return Number.isFinite(ms) ? (ms as number) : null;
  }, [auction.startTime]);

  const reactivateRemainingMs = useMemo(() => {
    if (!startTimeMs) return null;
    return Math.max(0, startTimeMs - nowMs);
  }, [startTimeMs, nowMs]);

  const canUncancel =
    auction.type === AuctionTypeEnum.TEST ||
    (reactivateRemainingMs !== null && reactivateRemainingMs > 0);

  // Requirement: when an auction is CANCELADA and the reactivation timer already ended
  // (i.e. it can no longer be "uncancelled"), the "Editar Subasta" button must be blocked.
  const isEditBlocked =
    auction.status === AuctionStatusEnum.CANCELADA && !canUncancel;

  const totalItems = auctionItems?.length || 0;
  const totalBids =
    auctionItems?.reduce(
      (sum: number, item) => sum + (item.bids?.length || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      <AuctionStartingOverlay
        enabled={auction.status === 'PENDIENTE'}
        startTime={auction.startTime}
        serverOffsetMs={serverOffsetMs}
        windowMs={10_000}
        graceMs={5_000}
        title="Iniciando subasta en vivo"
        description="La subasta comenzará en instantes…"
      />
      {connectionError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {connectionError}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 break-words">
              {auction.title}
            </h1>
            <Badge
              className={`${getAuctionBadgeColor(
                auctionStatus.displayStatus
              )} text-sm`}
            >
              {getAuctionStatusLabel(auctionStatus.displayStatus)}
            </Badge>
          </div>
          {auction.description && (
            <p className="text-gray-600 break-words">{auction.description}</p>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
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
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <Edit className="h-4 w-4" />
              Editar Subasta
            </Button>
          )}

          {(auction.status === AuctionStatusEnum.PENDIENTE ||
            auction.status === AuctionStatusEnum.CANCELADA ||
            auction.type === AuctionTypeEnum.TEST) && (
            <div
              // When NOT cancelled, make this action easy to spot by using the tenant primary color
              // (same visual language as primary buttons). When cancelled, keep the red warning style.
              style={
                !cancelChecked && primaryColor
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
              className={`rounded-lg border p-3 w-full md:w-[360px] ${
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
                    {cancelChecked && auction.type !== AuctionTypeEnum.TEST && (
                      <p className="text-xs text-gray-600 mt-1">
                        {canUncancel && reactivateRemainingMs !== null
                          ? `Puedes reactivarla antes del tiempo inicialmente establecido: ${formatCountdown(reactivateRemainingMs)}`
                          : 'El tiempo para reactivar la subasta ha finalizado.'}
                      </p>
                    )}
                  </div>
                </div>

                <Switch
                  id="cancel-auction"
                  checked={cancelChecked}
                  disabled={isCancelMutating || (cancelChecked && !canUncancel)}
                  onCheckedChange={handleCancelToggle}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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
            <div className="text-2xl font-bold text-blue-600">{totalBids}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              Participantes
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
          {auctionItems && auctionItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {auctionItems.map(
                (auctionItem: AuctionItemWithItmeAndBidsDto) => {
                  return (
                    <Card
                      key={auctionItem.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedItemForDetail(auctionItem)}
                    >
                      {/* Item Image */}
                      {auctionItem.item?.photos && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                          <SafeImage
                            src={auctionItem.item.photos.split(',')[0]?.trim()}
                            alt={`${auctionItem.item.brand} ${auctionItem.item.model}`}
                            fill
                            className="object-cover"
                            // 1 column on <lg and 2 columns on >=lg.
                            // 33vw requests a too-small variant on desktop and looks blurry.
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            quality={82}
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
                          </div>
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
            isManager={true}
            onRefresh={refetchParticipants}
            primaryColor={primaryColor}
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
          // IMPORTANT: do NOT rely on `router.refresh()` here.
          // The detail view data (auction + auctionItems) is loaded via a client-side
          // cache (useFetchData/SWR). When the modal updates the auction (e.g., adds
          // a new product), we must explicitly refetch the snapshot so the "Items de
          // Subasta" tab reflects the latest backend state.
          onRealtimeSnapshot?.();
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

  // Keep it compact for both web and mobile.
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
