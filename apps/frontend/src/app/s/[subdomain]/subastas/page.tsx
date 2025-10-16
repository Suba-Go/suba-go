import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AuctionDashboard } from '@/components/auctions/auction-dashboard';
import { AuctionDashboardSkeleton } from '@/components/auctions/auction-dashboard-skeleton';

export default async function SubastasPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
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
        <AuctionDashboard subdomain={subdomain} />
      </Suspense>
    </div>
  );
}
