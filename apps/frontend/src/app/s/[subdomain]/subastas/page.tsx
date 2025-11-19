'use client';
import { Suspense, use } from 'react';
import { AuctionDashboard } from '@/components/auctions/auction-dashboard';
import { AuctionDashboardSkeleton } from '@/components/auctions/auction-dashboard-skeleton';
import { AuctionWithItemsAndBidsDto } from '@suba-go/shared-validation';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

export default function SubastasPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = use(params);
  const {
    data: auctions,
    isLoading,
    error,
  } = useFetchData<AuctionWithItemsAndBidsDto[]>({
    url: `/api/auctions`,
    key: ['auctions', subdomain],
    revalidateOnMount: true,
    refreshInterval: 3,
  });

  if (!auctions || error) return;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Subastas
          </h1>
          <p className="text-gray-600 mt-2">
            Administra y monitorea todas las subastas de tu empresa
          </p>
        </div>
      </div>

      <Suspense fallback={<AuctionDashboardSkeleton />}>
        <AuctionDashboard
          auctions={auctions}
          isLoading={isLoading}
          error={error}
          subdomain={subdomain}
        />
      </Suspense>
    </div>
  );
}
