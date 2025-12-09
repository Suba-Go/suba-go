'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Edit, Trophy } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
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
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { AuctionEditModal } from '../auction-edit-modal';
import Image from 'next/image';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionStatusEnum,
  AuctionTypeEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { ParticipantsList } from '../participants-list';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';

interface AuctionManagerPendingViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  primaryColor?: string;
}

export function AuctionManagerPendingView({
  auction,
  auctionItems,
  primaryColor,
}: AuctionManagerPendingViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // Fetch participants data
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
    auction.endTime
  );

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
      router.refresh();
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

  const totalItems = auctionItems?.length || 0;
  const totalBids =
    auctionItems?.reduce(
      (sum: number, item) => sum + (item.bids?.length || 0),
      0
    ) || 0;

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
            <Badge
              className={`${getAuctionBadgeColor(
                auctionStatus.displayStatus
              )} text-sm`}
            >
              {getAuctionStatusLabel(auctionStatus.displayStatus)}
            </Badge>
          </div>
          {auction.description && (
            <p className="text-gray-600">{auction.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
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
            className="data-[state=active]:text-black data-[state=active]:shadow-sm font-medium transition-all"
            style={
              activeTab === 'items' && primaryColor
                ? {
                    backgroundColor: primaryColor,
                    color: '#000000',
                  }
                : undefined
            }
          >
            📦 Items de Subasta
          </TabsTrigger>
          <TabsTrigger
            value="participants"
            className="data-[state=active]:text-black data-[state=active]:shadow-sm font-medium transition-all"
            style={
              activeTab === 'participants' && primaryColor
                ? {
                    backgroundColor: primaryColor,
                    color: '#000000',
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
