import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ItemDetailSkeleton } from '@/components/items/item-detail-skeleton';
import { ItemDetail } from '@/components/items/item-detail';
import { PageContainer } from '@/components/layout/page-container';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const session = await auth();
  const { itemId } = await params;

  if (!session) {
    redirect('/login');
  }

  // All authenticated users can view products
  return (
    <PageContainer>
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetail itemId={itemId} userRole={session.user.role || 'USER'} />
      </Suspense>
    </PageContainer>
  );
}
