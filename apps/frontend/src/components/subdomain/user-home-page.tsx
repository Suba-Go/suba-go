'use client';

import { useMemo } from 'react';
import {
  CompanyDto,
  AuctionStatusEnum,
  ItemDto,
  AuctionDto,
  AuctionRegistrationWithAuctionDto,
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
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { Trophy, Gavel } from 'lucide-react';
import { useAutoFormat } from '@/hooks/use-auto-format';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuctionCard } from '@/components/auctions/auction-card';

interface UserHomePageProps {
  company: CompanyDto;
}

export function UserHomePage({ company }: UserHomePageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useAutoFormat();

  const userId = session?.user?.id;

  // Fetch items sold to this user
  const { data: soldItems, isLoading: itemsLoading } = useFetchData<ItemDto[]>({
    url: `/api/items/sold-to/${userId}`,
    key: ['sold-items', userId || ''],
    condition: !!userId,
  });

  // Fetch user's registered auctions
  const { data: userRegistrations, isLoading: registrationsLoading } =
    useFetchData<AuctionRegistrationWithAuctionDto[]>({
      url: `/api/auctions/my-registrations`,
      key: ['my-registrations', userId || ''],
      condition: !!userId,
    });

  const primaryColor = company.principal_color || '#3B82F6';

  // Get auctions where user is registered
  const availableAuctions = useMemo(() => {
    if (!userRegistrations) return [];

    // Use Map to prevent duplicates
    const auctionMap = new Map<string, AuctionDto>();

    userRegistrations.forEach((reg) => {
      const auction = reg.auction;
      if (!auction) return;

      // Only include ACTIVA and PENDIENTE auctions
      const auctionState = auction.status;
      if (
        auctionState === AuctionStatusEnum.ACTIVA ||
        auctionState === AuctionStatusEnum.PENDIENTE
      ) {
        if (!auctionMap.has(auction.id)) {
          auctionMap.set(auction.id, auction);
        }
      }
    });

    return Array.from(auctionMap.values());
  }, [userRegistrations]);

  const isLoading = itemsLoading || registrationsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="size-4" />
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
        {/* Adjudicated Items Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Items Adjudicados
            </h2>
          </div>

          {soldItems && soldItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldItems.map((item: ItemDto) => {
                const photoUrl = item.photos?.split(',')[0]?.trim();
                // const latestAuction = item.auctionItems?.[0]?.auction;

                return (
                  <Card
                    key={item.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/items/${item.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {item.brand} {item.model}
                          </CardTitle>
                          <CardDescription>
                            {item.plate || 'Sin patente'}
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
                            height={40}
                            width={40}
                            alt={`${item.brand} ${item.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio Final:</span>
                          <span className="font-semibold">
                            {formatPrice(item.soldPrice || 0)}
                          </span>
                        </div>
                        {/* {latestAuction && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subasta:</span>
                            <span className="font-medium truncate ml-2">
                              {latestAuction.title}
                            </span>
                          </div>
                        )} */}
                        {item.soldAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Comprado:</span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.soldAt).toLocaleDateString(
                                'es-ES',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        )}
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
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="h-6 w-6" />
            <h2 className="text-2xl font-bold text-gray-900">
              Mis Subastas Registradas
            </h2>
          </div>

          {availableAuctions && availableAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  onUpdate={() => null}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No estás registrado en ninguna subasta
                </h3>
                <p className="text-gray-600">
                  Regístrate en subastas activas para participar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
