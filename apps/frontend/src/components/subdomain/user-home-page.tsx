'use client';

import { useState, useMemo } from 'react';
import { CompanyDto, AuctionStatusEnum } from '@suba-go/shared-validation';
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
import { Switch } from '@suba-go/shared-components/components/ui/switch';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { Trophy, Gavel } from 'lucide-react';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { useRouter } from 'next-nprogress-bar';
import Image from 'next/image';
import { AuctionCard } from '@/components/auctions/auction-card';

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

  // TODO: Implement /bids/my-bids endpoint in backend
  // Fetch user's bids to find adjudicated items
  // const { data: userBids, isLoading: bidsLoading } = useFetchData<any[]>({
  //   url: '/api/bids/my-bids',
  //   key: ['my-bids', userId || ''],
  //   condition: !!userId,
  // });
  const userBids: any[] = [];
  const bidsLoading = false;

  // Fetch user's registered auctions
  const {
    data: userRegistrations,
    isLoading: registrationsLoading,
    refetch: refetchRegistrations,
  } = useFetchData<any[]>({
    url: `/api/auctions/my-registrations`,
    key: ['my-registrations', userId || ''],
    condition: !!userId,
  });

  const primaryColor = company.principal_color || '#3B82F6';

  // Build list of auctions from registrations and bids
  const filteredAuctions = useMemo(() => {
    if (showAllAuctions) {
      // Toggle ON: Show auctions where user has placed bids (regardless of state)
      // Extract unique auctions from bids using Map to prevent duplicates
      const auctionMap = new Map();
      userBids?.forEach((bid: any) => {
        const auction = bid.auctionItem?.auction;
        if (auction && !auctionMap.has(auction.id)) {
          // Map Prisma field names to frontend expected names
          auctionMap.set(auction.id, {
            ...auction,
            start: auction.startTime || auction.start,
            end: auction.endTime || auction.end,
            state: auction.status || auction.state,
            tenantId: auction.tenantId, // Include tenantId for navigation
          });
        }
      });
      return Array.from(auctionMap.values());
    }

    // Default: Show ACTIVA and PENDIENTE auctions where user is registered
    // Use Map to prevent duplicates in case of multiple registrations
    const auctionMap = new Map();
    userRegistrations?.forEach((reg: any) => {
      const auction = reg.auction;
      if (!auction) return;

      // Only include ACTIVA and PENDIENTE auctions
      const auctionState = auction.status || auction.state;
      if (
        auctionState === AuctionStatusEnum.ACTIVA ||
        auctionState === AuctionStatusEnum.PENDIENTE
      ) {
        if (!auctionMap.has(auction.id)) {
          // Map Prisma field names to frontend expected names
          auctionMap.set(auction.id, {
            ...auction,
            start: auction.startTime || auction.start,
            end: auction.endTime || auction.end,
            state: auctionState,
            tenantId: auction.tenantId, // Include tenantId for navigation
          });
        }
      }
    });

    return Array.from(auctionMap.values());
  }, [showAllAuctions, userBids, userRegistrations]);

  // Find adjudicated items (items where user won in completed auctions)
  // Use a Map to deduplicate by item ID
  const adjudicatedItemsMap = new Map();

  userBids?.forEach((bid: any) => {
    const auction = bid.auctionItem?.auction;
    const item = bid.auctionItem?.item;

    // Debug logging
    if (auction?.status === AuctionStatusEnum.COMPLETADA) {
      console.log('[UserHomePage] Completed auction bid:', {
        itemId: item?.id,
        itemState: item?.state,
        soldToUserId: item?.soldToUserId,
        currentUserId: userId,
        matches: item?.soldToUserId === userId,
      });
    }

    // Only include if auction is completed and item was sold to this user
    if (
      auction?.status === AuctionStatusEnum.COMPLETADA &&
      item?.soldToUserId === userId &&
      item?.state === 'VENDIDO'
    ) {
      // Use item ID as key to prevent duplicates
      if (!adjudicatedItemsMap.has(item.id)) {
        adjudicatedItemsMap.set(item.id, bid);
      }
    }
  });

  const adjudicatedItems = Array.from(adjudicatedItemsMap.values());

  console.log(
    '[UserHomePage] Adjudicated items count:',
    adjudicatedItems.length
  );

  const isLoading = bidsLoading || registrationsLoading;

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
            Gestiona tus items adjudicados y participa en subastas disponibles
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
                    onClick={() => router.push(`/items/${item?.id}`)}
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
                Mostrar subastas donde he pujado
              </Label>
            </div>
          </div>

          {filteredAuctions && filteredAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={{
                    id: auction.id,
                    title: auction.title || auction.name || 'Sin título',
                    description: auction.description,
                    startTime: auction.startTime || auction.start,
                    endTime: auction.endTime || auction.end,
                    status: auction.status || auction.state,
                    type: auction.type,
                    items: auction.items,
                    tenantId: auction.tenantId,
                  }}
                  subdomain={subdomain}
                  onUpdate={refetchRegistrations}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {showAllAuctions
                      ? 'No has pujado en ninguna subasta todavía'
                      : 'No tienes subastas activas o pendientes disponibles'}
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
