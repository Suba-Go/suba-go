import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ItemsDashboard } from '@/components/items/items-dashboard';
import { ItemsDashboardSkeleton } from '@/components/items/items-dashboard-skeleton';
import { isUserAdminOrManager } from '@/utils/subdomain-profile-validation';
import { PageContainer } from '@/components/layout/page-container';

interface ItemsPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { subdomain } = await params;
  const session = await auth();

  // Verificar que el usuario tenga rol de AUCTION_MANAGER o ADMIN
  if (!session || !isUserAdminOrManager(session)) {
    redirect('/');
  }

  return (
    <PageContainer>
      <Suspense fallback={<ItemsDashboardSkeleton />}>
        <ItemsDashboard subdomain={subdomain} />
      </Suspense>
    </PageContainer>
  );
}
