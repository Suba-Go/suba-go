'use client';

import { useState, useEffect, useRef } from 'react';

import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  Edit,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
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
import { useRouter } from 'next-nprogress-bar';
import { useAuctionStatus } from '@/hooks/use-auction-status';
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
}

export function AuctionDetail({
  auction,
  auctionItems,
  userRole,
  accessToken,
  tenantId,
  onRealtimeSnapshot,
}: AuctionDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // WebSocket state for real-time updates (AUCTION_MANAGER only)
  const wsRef = useRef<WebSocket | null>(null);
  const connectionAttemptedRef = useRef(false); // Prevent duplicate connections
  const [isWsConnected, setIsWsConnected] = useState(false);
  // const [isWsJoined, setIsWsJoined] = useState(false);
  const [liveParticipantCount, setLiveParticipantCount] = useState(0);

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

  // Store callbacks in refs to avoid reconnection when they change
  const onRealtimeSnapshotRef = useRef(onRealtimeSnapshot);
  const refetchParticipantsRef = useRef(refetchParticipants);
  const routerRef = useRef(router);

  // Update refs when callbacks change (without causing reconnection)
  useEffect(() => {
    onRealtimeSnapshotRef.current = onRealtimeSnapshot;
    refetchParticipantsRef.current = refetchParticipants;
    routerRef.current = router;
  }, [onRealtimeSnapshot, refetchParticipants, router]);

  // WebSocket connection for AUCTION_MANAGER - ONLY for participant count
  useEffect(() => {
    // Only connect if user is AUCTION_MANAGER and we have required data
    if (
      userRole !== UserRolesEnum.AUCTION_MANAGER ||
      !accessToken ||
      !tenantId ||
      !auction?.id
    ) {
      return;
    }

    // Don't connect if auction is already completed
    if (auction.status === AuctionStatusEnum.COMPLETADA) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsWsConnected(false);
      return;
    }

    // Prevent duplicate connections
    if (connectionAttemptedRef.current) {
      return;
    }

    // Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    connectionAttemptedRef.current = true;

    // Derive WebSocket URL from BACKEND_URL
    const getWebSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_WS_ENDPOINT) {
        return process.env.NEXT_PUBLIC_WS_ENDPOINT;
      }
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      return backendUrl.replace(/^http/, 'ws') + '/ws';
    };

    const wsEndpoint = getWebSocketUrl();
    const wsUrl = `${wsEndpoint}?token=${encodeURIComponent(accessToken)}`;
    const auctionId = auction.id;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsWsConnected(true);
      // Join auction room immediately (no HELLO handshake needed)
      ws.send(
        JSON.stringify({
          event: 'JOIN_AUCTION',
          data: { tenantId, auctionId },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.event) {
          case 'CONNECTED':
            // Connection acknowledged
            break;

          case 'JOINED':
            if (message.data.participantCount !== undefined) {
              setLiveParticipantCount(message.data.participantCount);
            }
            onRealtimeSnapshotRef.current?.();
            break;

          case 'PARTICIPANT_COUNT':
            setLiveParticipantCount(message.data.count);
            break;

          case 'ERROR':
            console.error('[Manager WS] Server error:', message.data);
            setIsWsConnected(false);
            break;
        }
      } catch (error) {
        console.error('[Manager WS] Parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[Manager WS] Error:', error);
      setIsWsConnected(false);
    };

    ws.onclose = () => {
      setIsWsConnected(false);
      connectionAttemptedRef.current = false; // Allow reconnection
    };

    // Cleanup on unmount
    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
      wsRef.current = null;
      connectionAttemptedRef.current = false;
    };
  }, [
    userRole,
    accessToken,
    tenantId,
    auction?.id, // Only use auction.id, not the whole object
    auction?.status, // Only use auction.status
  ]);

  const handleCancelToggle = async (checked: boolean) => {
    try {
      const endpoint = checked
        ? `/api/auctions/${auction.id}/cancel`
        : `/api/auctions/${auction.id}/uncancel`;

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(
          checked
            ? 'Error al cancelar la subasta'
            : 'Error al descancelar la subasta'
        );
      }

      toast({
        title: checked ? 'Subasta cancelada' : 'Subasta descancelada',
        description: checked
          ? 'La subasta ha sido cancelada exitosamente'
          : 'La subasta ha sido descancelada exitosamente',
      });

      setIsCanceled(checked);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo realizar la operación',
        variant: 'destructive',
      });
    }
  };

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
                  <div className="flex items-center gap-2">
                    <Switch
                      id="cancel-auction"
                      checked={auction.status === 'CANCELADA' || isCanceled}
                      onCheckedChange={handleCancelToggle}
                    />
                    <Label htmlFor="cancel-auction" className="cursor-pointer">
                      Cancelar Subasta
                    </Label>
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

      {/* Countdown Timer for Active Auctions */}
      {auctionStatus.isActive && auctionStatus.timeRemainingDetailed && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-2">
                  Subasta Activa - Termina en:
                </h3>
                <div className="flex gap-4 text-2xl font-bold text-green-700">
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
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="items"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all"
          >
            📦 Items de Subasta
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium transition-all"
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
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                                      Ganando:{' '}
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
