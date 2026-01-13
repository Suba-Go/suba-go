'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { AuctionCard } from '@/components/auctions/auction-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { AuctionDto } from '@suba-go/shared-validation';
import Link from 'next/link';
import { Button } from '@suba-go/shared-components/components/ui/button';

import Image from 'next/image';

interface SoldItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  version?: string;
  soldPrice: number;
  soldAt: string;
  photos?: string;
}

export default function UserHomePage() {
  const { data: session } = useSession();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color || '#3B82F6';

  // Fetch active auctions using SWR for automatic updates
  const {
    data: allAuctions,
    isLoading: isLoadingAuctions,
    error: auctionsError,
  } = useFetchData<AuctionDto[]>({
    url: '/api/auctions',
    key: ['user-active-auctions'],
    refreshInterval: 5000, // Poll every 5 seconds to check for new registrations/status changes
  });

  // Fetch sold items
  const {
    data: soldItemsData,
    isLoading: isLoadingSoldItems,
    error: soldItemsError,
  } = useFetchData<SoldItem[]>({
    url: session?.user?.id ? `/api/items/sold-to/${session.user.id}` : '',
    key: ['user-sold-items', session?.user?.id || ''],
    condition: !!session?.user?.id,
  });

  // Filter active auctions where user is registered
  const activeAuctions = useMemo(() => {
    if (!allAuctions || !Array.isArray(allAuctions) || !session?.user?.id)
      return [];

    return allAuctions.filter((a: AuctionDto & { registeredUsers?: any[] }) => {
      const isStatusValid = a.status === 'ACTIVA' || a.status === 'PENDIENTE';
      // Check if user is registered for this auction
      const isRegistered = a.registeredUsers?.some(
        (reg: any) => reg.userId === session.user.id
      );
      return isStatusValid && isRegistered;
    });
  }, [allAuctions, session?.user?.id]);

  const soldItems = Array.isArray(soldItemsData) ? soldItemsData : [];
  const loading = isLoadingAuctions || isLoadingSoldItems;

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (auctionsError || soldItemsError) {
    return (
      <div className="text-center py-8 text-red-500">
        Error al cargar los datos. Por favor recarga la página.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Subastas Activas */}
      <section>
        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
          Subastas Activas
        </h2>
        {activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onUpdate={() => undefined} // No-op, updates handled by SWR
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border">
            <p className="text-gray-500">
              No hay subastas activas en este momento.
            </p>
          </div>
        )}
      </section>

      {/* Mis Items Adjudicados */}
      <section>
        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
          Mis Adjudicaciones
        </h2>
        {soldItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {soldItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video relative bg-gray-100">
                  {(() => {
                    const getFirstPhoto = (
                      photos: string | undefined
                    ): string | null => {
                      if (!photos) return null;

                      // 1. Try splitting by comma (this covers simple CSV and some legacy formats)
                      const parts = photos.split(',');
                      if (parts.length > 0) {
                        const first = parts[0].trim();
                        // If it looks like a URL (starts with http or /), return it
                        // Also remove any residual JSON brackets/quotes if mixed format
                        const clean = first.replace(/['"[\]]/g, '');
                        if (clean.startsWith('http') || clean.startsWith('/')) {
                          return clean;
                        }
                      }

                      // 2. Try parsing as JSON array if step 1 didn't yield a valid URL
                      try {
                        const parsed = JSON.parse(photos);
                        if (
                          Array.isArray(parsed) &&
                          parsed.length > 0 &&
                          typeof parsed[0] === 'string'
                        ) {
                          return parsed[0];
                        }
                      } catch (e) {
                        // ignore
                      }

                      // 3. Fallback: return as is if it looks like a URL
                      const rawTrimmed = photos.trim();
                      if (
                        rawTrimmed.startsWith('http') ||
                        rawTrimmed.startsWith('/')
                      ) {
                        return rawTrimmed;
                      }

                      return null;
                    };

                    const photoUrl = getFirstPhoto(item.photos);

                    if (photoUrl) {
                      return (
                        <Image
                          src={photoUrl}
                          alt={`${item.brand} ${item.model}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.srcset = '/placeholder-car.png';
                          }}
                        />
                      );
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Sin foto
                        </div>
                      );
                    }
                  })()}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {item.brand} {item.model} {item.year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{item.version}</p>
                  <p className="text-sm font-medium text-gray-900">
                    Adjudicado por: ${item.soldPrice.toLocaleString('es-CL')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Fecha: {new Date(item.soldAt).toLocaleDateString('es-CL')}
                  </p>
                  <Link href={`/items/${item.id}`} className="block mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      Ver Detalle
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Aún no tienes items adjudicados.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
