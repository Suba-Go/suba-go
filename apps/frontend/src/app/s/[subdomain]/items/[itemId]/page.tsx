import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ItemDetailSkeleton } from '@/components/items/item-detail-skeleton';
import { ItemDetail } from '@/components/items/item-detail';

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
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetail itemId={itemId} userRole={session.user.role || 'USER'} />
      </Suspense>
    </div>
  );
}
