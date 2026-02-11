'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { getPrimaryPhotoUrl } from '@/lib/auction-utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
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
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  BidWithUserDto,
  ItemStateEnum,
  UserSafeDto,
} from '@suba-go/shared-validation';
import { ParticipantsList } from '../participants-list';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { ItemBidHistory } from '../user-view/item-bid-history';

interface AuctionManagerCompletedViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  primaryColor?: string;
}

export function AuctionManagerCompletedView({
  auction,
  auctionItems,
  primaryColor,
}: AuctionManagerCompletedViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('items');
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);

  // AUCTION_MANAGER / ADMIN requirement: show real user name (fallback to email),
  // while USER views keep using public_name. This view is manager-only.
  const getRealUserLabel = (u?: {
    name?: string | null;
    email?: string | null;
    public_name?: string | null;
  } | null) => u?.name || u?.email || u?.public_name || 'Usuario';

  // Fetch participants data
  const { data: participants, refetch: refetchParticipants } = useFetchData<
    UserSafeDto[]
  >({
    url: `/api/auctions/${auction.id}/participants`,
    key: ['auction-participants', auction.id],
    condition: true,
    fallbackData: [],
  });

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

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {auction.title}
            </h1>
            <Badge
              className={`${getAuctionBadgeColor(auction.status)} text-xs sm:text-sm`}
            >
              {getAuctionStatusLabel(auction.status)}
            </Badge>
          </div>
          {auction.description && (
            <p className="text-gray-600 break-words">{auction.description}</p>
          )}
        </div>
      </div>

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
                          <SafeImage
                            src={getPrimaryPhotoUrl(auctionItem.item.photos)}
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
                                        {auctionItem.item?.state === ItemStateEnum.VENDIDO
                                          ? 'Ganador/a:'
                                          : 'Ganando:'}{' '}
                                        <span className="font-medium text-gray-900">
                                          {getRealUserLabel(topBid.user as any)}
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
                                showRealNames
                              />
                            </>
                          )}

                          {/* Sale Status Badge */}
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
                                        {getRealUserLabel(
                                          auctionItem.item.soldToUser as any
                                        )}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary">Sin ofertas</Badge>
                            )}
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
            selectedItemForDetail.bids?.[0]?.offered_price ||
              selectedItemForDetail.startingBid ||
              0
          )}
          bidIncrement={Number(auction.bidIncrement || 50000)}
          isUserView={false}
          showBidHistory={true}
          showBidderRealNames={true}
        />
      )}
    </div>
  );
}
