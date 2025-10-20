'use client';

import { useState } from 'react';

import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Trophy,
  Edit,
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
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useFetchData } from '@/hooks/use-fetch-data';
import type {
  AuctionData,
  AuctionItem,
  AuctionBid,
} from '@/types/auction.types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { AuctionEditModal } from './auction-edit-modal';
import Image from 'next/image';
import { useRouter } from 'next-nprogress-bar';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import { AuctionStatusEnum } from '@suba-go/shared-validation';

interface AuctionDetailProps {
  auctionId: string;
  userRole: string;
  userId?: string;
}

export function AuctionDetail({ auctionId, userRole }: AuctionDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  // Fetch auction data
  const {
    data: auction,
    isLoading,
    error,
    refetch,
  } = useFetchData<AuctionData>({
    url: `/api/auctions/${auctionId}`,
    key: ['auction', auctionId],
  });

  // Use the automatic status hook (must be called before early returns)
  const auctionStatus = useAuctionStatus(
    auction?.status || AuctionStatusEnum.PENDIENTE,
    auction?.startTime || new Date(),
    auction?.endTime || new Date()
  );

  const handleCancelToggle = async (checked: boolean) => {
    try {
      const endpoint = checked
        ? `/api/auctions/${auctionId}/cancel`
        : `/api/auctions/${auctionId}/uncancel`;

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
      refetch();
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

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error al cargar la subasta
        </h2>
        <p className="text-gray-600 mb-4">
          No se pudo cargar la información de la subasta
        </p>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : String(error)}
        </p>

        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  if (isLoading || !auction) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);

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

  const totalItems = auction.items?.length || 0;
  const totalBids =
    auction.items?.reduce(
      (sum: number, item: AuctionItem) => sum + item.bids.length,
      0
    ) || 0;
  const totalParticipants = new Set(
    auction.items?.flatMap((item: AuctionItem) =>
      item.bids.map((bid: AuctionBid) => bid.userId)
    )
  ).size;

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {auction.title}
            </h1>
            {getStatusBadge()}
          </div>
          {auction.description && (
            <p className="text-gray-600">{auction.description}</p>
          )}
        </div>

        {/* Action buttons for auction managers */}
        {userRole === 'AUCTION_MANAGER' && (
          <div className="flex items-center gap-4">
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
                {(auction.status === 'PENDIENTE' ||
                  auction.status === 'CANCELADA') && (
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
                {(auction.status === 'PENDIENTE' ||
                  auction.status === 'CANCELADA' ||
                  auction.type === 'TEST') && (
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
            <div className="text-2xl font-bold text-blue-600">{totalBids}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Participantes
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
          {auction.items && auction.items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {auction.items.map((auctionItem: AuctionItem) => (
                <Card
                  key={auctionItem.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    if (auctionItem.item?.id) {
                      router.push(`/items/${auctionItem.item.id}`);
                    }
                  }}
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
                          const target = e.currentTarget as HTMLImageElement;
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
                          <p className="text-xs text-gray-500">Puja inicial</p>
                          <p className="font-semibold text-green-600">
                            ${Number(auctionItem.startingBid).toLocaleString()}
                          </p>
                        </div>

                        {auctionItem.bids && auctionItem.bids.length > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Puja más alta
                            </p>
                            <p className="font-semibold text-blue-600">
                              $
                              {Number(
                                auctionItem.bids[0].amount
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {auctionItem.bids && auctionItem.bids.length > 0 && (
                        <p className="text-xs text-gray-500 pt-1">
                          {auctionItem.bids.length} puja(s) realizadas
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
          <Card className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium">Lista de Participantes</h3>
              <p className="text-sm text-gray-600">
                Componente ParticipantsList será implementado
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <AuctionEditModal
        auction={auction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
