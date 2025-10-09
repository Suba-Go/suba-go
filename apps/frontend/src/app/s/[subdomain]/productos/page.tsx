import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProductsDashboard } from '@/components/products/products-dashboard';
import { ProductsDashboardSkeleton } from '@/components/products/products-dashboard-skeleton';

interface ProductsPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { subdomain } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/s/${subdomain}/login`);
  }

  // Verificar que el usuario tenga rol de AUCTION_MANAGER
  if (session.user.role !== 'AUCTION_MANAGER') {
    redirect(`/s/${subdomain}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
        <p className="text-gray-600 mt-2">
          Administra los productos disponibles para las subastas
        </p>
      </div>

      <Suspense fallback={<ProductsDashboardSkeleton />}>
        <ProductsDashboard subdomain={subdomain} />
      </Suspense>
    </div>
  );
}
