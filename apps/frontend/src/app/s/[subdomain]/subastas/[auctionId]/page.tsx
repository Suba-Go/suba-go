import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AuctionDetail } from '@/components/auctions/auction-detail';
import { AuctionDetailSkeleton } from '@/components/auctions/auction-detail-skeleton';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; auctionId: string }>;
}) {
  const session = await auth();
  const { subdomain, auctionId } = await params;

  // Verify user has access to auctions (AUCTION_MANAGER or regular user)
  const hasAccess =
    session?.user.role === 'AUCTION_MANAGER' || session?.user.role === 'USER';

  if (!hasAccess) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AuctionDetailSkeleton />}>
        <AuctionDetail
          auctionId={auctionId}
          subdomain={subdomain}
          userRole={session?.user.role || 'USER'}
          userId={session?.user.id || ''}
        />
      </Suspense>
    </div>
  );
}
