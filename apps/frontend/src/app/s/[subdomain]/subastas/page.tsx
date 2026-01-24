'use client';
import { Suspense, use, useEffect } from 'react';
import { AuctionDashboard } from '@/components/auctions/auction-dashboard';
import { AuctionDashboardSkeleton } from '@/components/auctions/auction-dashboard-skeleton';
import { AuctionWithItemsAndBidsDto } from '@suba-go/shared-validation';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';

export default function SubastasPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (
      !session ||
      (session.user.role !== 'AUCTION_MANAGER' && session.user.role !== 'ADMIN')
    ) {
      router.push('/');
    }
  }, [session, status, router]);

  const canAccess =
    status === 'authenticated' &&
    !!session &&
    (session.user.role === 'AUCTION_MANAGER' || session.user.role === 'ADMIN');

  // TODO: un refresh que se gatille despues de crear una subasta
  const {
    data: auctions = [],
    isLoading,
    error,
    refetch,
  } = useFetchData<AuctionWithItemsAndBidsDto[]>({
    url: `/api/auctions`,
    key: ['auctions', subdomain],
    revalidateOnMount: true,
    refreshInterval: 3,
    fallbackData: [],
    condition: canAccess,
    errorMessage: 'No se pudieron cargar las subastas',
    maxRetries: 3,
    retryDelayMs: 300,
    retryStatuses: [401, 503],
  });
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-4" />
        </div>
      </div>
    );
  }

  // While redirecting (or if not allowed), don't crash the render.
  if (!canAccess) {
    return null;
  }

  if (error) {
    return (
      <PageContainer>
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-600">No se pudo cargar la subasta</p>
          <button
            className="px-4 py-2 rounded-md border"
            onClick={() => refetch()}
            type="button"
          >
            Reintentar
          </button>
        </div>
      </PageContainer>
    );
  }

  // Use company from context (loaded once in conditional-layout)
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;


  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="size-4" />
        </div>
      </div>
    );
  }
  return (
    <PageContainer>
      <Suspense fallback={<AuctionDashboardSkeleton />}>
        <AuctionDashboard
          auctions={auctions}
          primaryColor={primaryColor}
          isLoading={isLoading}
          error={error}
          subdomain={subdomain}
        />
      </Suspense>
    </PageContainer>
  );
}
