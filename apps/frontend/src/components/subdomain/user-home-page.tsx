'use client';

import { useState } from 'react';
import {
  CompanyDto,
  AuctionStatusEnum,
  AuctionDto,
} from '@suba-go/shared-validation';
import { useFetchData } from '@/hooks/use-fetch-data';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { Trophy, Gavel, Calendar, Clock, Car, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next-nprogress-bar';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import Image from 'next/image';

interface UserHomePageProps {
  company: CompanyDto;
  subdomain: string;
}

export function UserHomePage({ company, subdomain }: UserHomePageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useAutoFormat();
  const [showAllAuctions, setShowAllAuctions] = useState(false);

  const userId = session?.user?.id;

  // Fetch user's bids to find adjudicated items
  const { data: userBids, isLoading: bidsLoading } = useFetchData<any[]>({
    url: '/api/bids/my-bids',
    key: ['my-bids', userId || ''],
    condition: !!userId,
  });

  // Fetch all auctions
  const { data: allAuctions, isLoading: auctionsLoading } = useFetchData<
    AuctionDto[]
  >({
    url: '/api/auctions',
    key: ['auctions', subdomain],
  });

  const primaryColor = company.principal_color || '#3B82F6';

  // Filter auctions based on showAllAuctions toggle
  const filteredAuctions = allAuctions?.filter((auction) => {
    if (showAllAuctions) {
      return true; // Show all auctions
    }
    // Only show ACTIVA and PENDIENTE (future) auctions
    return (
      auction.state === AuctionStatusEnum.ACTIVA ||
      auction.state === AuctionStatusEnum.PENDIENTE
    );
  });

  // Find adjudicated items (items where user has the winning bid in completed auctions)
  const adjudicatedItems = userBids?.filter((bid: any) => {
    const auction = bid.auctionItem?.auction;
    if (!auction || auction.status !== AuctionStatusEnum.COMPLETADA) {
      return false;
    }

    // Check if this bid is the highest for this auction item
    const allBidsForItem = userBids.filter(
      (b: any) => b.auctionItemId === bid.auctionItemId
    );
    const highestBid = Math.max(
      ...allBidsForItem.map((b: any) => b.offered_price)
    );

    return bid.offered_price === highestBid;
  });

  const isLoading = bidsLoading || auctionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={
        {
          '--primary-color': primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: primaryColor }}
          >
            Bienvenido, {session?.user?.name || 'Usuario'}
          </h1>
          <p className="text-gray-600">
            Gestiona tus items adjudicados y participa en subastas activas
          </p>
        </div>

        {/* Adjudicated Items Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Items Adjudicados
            </h2>
          </div>

          {adjudicatedItems && adjudicatedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adjudicatedItems.map((bid: any) => {
                const item = bid.auctionItem?.item;
                const photoUrl = item?.photos?.split(',')[0]?.trim();

                return (
                  <Card
                    key={bid.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() =>
                      router.push(`/s/${subdomain}/items/${item?.id}`)
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {item?.brand} {item?.model}
                          </CardTitle>
                          <CardDescription>
                            {item?.plate || 'Sin patente'}
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Adjudicado
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {photoUrl && (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                          <Image
                            src={photoUrl}
                            fill
                            alt={`${item?.brand} ${item?.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Puja Ganadora:</span>
                          <span className="font-semibold">
                            {formatPrice(bid.offered_price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subasta:</span>
                          <span className="font-medium truncate ml-2">
                            {bid.auctionItem?.auction?.title}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes items adjudicados
                </h3>
                <p className="text-gray-600">
                  Participa en subastas activas para ganar items
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Auctions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gavel className="h-6 w-6" style={{ color: primaryColor }} />
              <h2 className="text-2xl font-bold text-gray-900">
                Subastas Disponibles
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-all"
                checked={showAllAuctions}
                onCheckedChange={setShowAllAuctions}
              />
              <Label htmlFor="show-all" className="cursor-pointer">
                Mostrar todas (incluidas pasadas)
              </Label>
            </div>
          </div>

          {filteredAuctions && filteredAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAuctions.map((auction) => {
                const startTime = new Date(auction.start);
                const endTime = auction.end
                  ? new Date(auction.end)
                  : new Date();

                return (
                  <AuctionCardComponent
                    key={auction.id}
                    auction={auction}
                    startTime={startTime}
                    endTime={endTime}
                    subdomain={subdomain}
                    router={router}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No hay subastas disponibles en este momento
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component to use hooks properly
function AuctionCardComponent({
  auction,
  startTime,
  endTime,
  subdomain,
  router,
}: {
  auction: AuctionDto;
  startTime: Date;
  endTime: Date;
  subdomain: string;
  router: ReturnType<typeof useRouter>;
}) {
  // Use automatic status hook
  const auctionStatus = useAuctionStatus(
    auction.state,
    auction.start,
    auction.end || new Date()
  );

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/s/${subdomain}/subastas/${auction.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{auction.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              Sin descripción
            </CardDescription>
          </div>
          <Badge className={getAuctionBadgeColor(auctionStatus.displayStatus)}>
            {getAuctionStatusLabel(auctionStatus.displayStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Timing Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {auctionStatus.isActive && auctionStatus.timeRemaining ? (
              <>
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">
                  Termina en {auctionStatus.timeRemaining}
                </span>
              </>
            ) : auctionStatus.isPending && auctionStatus.timeRemaining ? (
              <>
                <Calendar className="h-4 w-4" />
                <span>Inicia en {auctionStatus.timeRemaining}</span>
              </>
            ) : auctionStatus.isCompleted ? (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>
                  Finalizó el {format(endTime, 'PPP', { locale: es })}
                </span>
              </>
            ) : auctionStatus.isCanceled ? (
              <>
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700">Cancelada</span>
              </>
            ) : null}
          </div>

          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/s/${subdomain}/subastas/${auction.id}`);
            }}
          >
            Ver Subasta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
