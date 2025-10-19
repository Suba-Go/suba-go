import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProductDetail } from '@/components/products/product-detail';
import { ProductDetailSkeleton } from '@/components/products/product-detail-skeleton';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; productId: string }>;
}) {
  const session = await auth();
  const { subdomain, productId } = await params;

  if (!session) {
    redirect('/login');
  }

  // All authenticated users can view products
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail
          productId={productId}
          subdomain={subdomain}
          userRole={session.user.role || 'USER'}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

