'use client';

import { useEffect, useState } from 'react';
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

  const [activeAuctions, setActiveAuctions] = useState<AuctionDto[]>([]);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const [auctionsRes, itemsRes] = await Promise.all([
          fetch('/api/auctions'),
          fetch(`/api/items/sold-to/${session.user.id}`),
        ]);

        if (auctionsRes.ok) {
          const auctionsData = await auctionsRes.json();
          // Filter for active or pending auctions
          const filtered = (
            Array.isArray(auctionsData) ? auctionsData : []
          ).filter(
            (a: AuctionDto) => a.status === 'ACTIVA' || a.status === 'PENDIENTE'
          );
          setActiveAuctions(filtered);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setSoldItems(Array.isArray(itemsData) ? itemsData : []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
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
                  {item.photos ? (
                    <img
                      src={JSON.parse(item.photos)[0] || '/placeholder-car.png'}
                      alt={`${item.brand} ${item.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin foto
                    </div>
                  )}
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

      {/* Subastas Activas o Por Participar */}
      <section>
        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
          Subastas Activas y Próximas
        </h2>
        {activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onUpdate={() => {
                  /* No-op for user view */
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay subastas activas o próximas en este momento.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
