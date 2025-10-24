import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AuctionDetail } from '@/components/auctions/auction-detail';
import { AuctionDetailSkeleton } from '@/components/auctions/auction-detail-skeleton';
import { isUserRole } from '@/lib/auction-utils';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; auctionId: string }>;
}) {
  const session = await auth();
  const { auctionId } = await params;

  // Verify user has access to auctions (AUCTION_MANAGER or regular user)
  const hasAccess =
    session && (session.user.role === 'AUCTION_MANAGER' || isUserRole(session.user.role));

  if (!hasAccess) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AuctionDetailSkeleton />}>
        <AuctionDetail
          auctionId={auctionId}
          userRole={session.user.role || 'USER'}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
