import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ItemsDashboard } from '@/components/items/items-dashboard';
import { ItemsDashboardSkeleton } from '@/components/items/items-dashboard-skeleton';

interface ItemsPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { subdomain } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Verificar que el usuario tenga rol de AUCTION_MANAGER
  if (session.user.role !== 'AUCTION_MANAGER') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Productos
        </h1>
        <p className="text-gray-600 mt-2">
          Administra los productos disponibles para las subastas
        </p>
      </div>

      <Suspense fallback={<ItemsDashboardSkeleton />}>
        <ItemsDashboard subdomain={subdomain} />
      </Suspense>
    </div>
  );
}
