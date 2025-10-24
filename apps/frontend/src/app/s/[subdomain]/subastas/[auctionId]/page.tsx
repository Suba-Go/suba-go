import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AuctionViewRouter } from '@/components/auctions/auction-view-router';
import { AuctionDetailSkeleton } from '@/components/auctions/auction-detail-skeleton';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ subdomain: string; auctionId: string }>;
}) {
  const session = await auth();
  const { subdomain, auctionId } = await params;

  if (!session) {
    redirect('/login');
  }

  // Verify user has access to auctions (AUCTION_MANAGER or regular user)
  const hasAccess =
    session.user.role === 'AUCTION_MANAGER' || session.user.role === 'USER';

  if (!hasAccess) {
    redirect('/');
  }

  // Get access token and tenant ID for WebSocket
  const accessToken = session.tokens.accessToken;
  const tenantId = session.user.tenant?.id;
  const userId = session.user.id;

  if (!tenantId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Error: Usuario sin tenant asignado
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AuctionDetailSkeleton />}>
        <AuctionViewRouter
          auctionId={auctionId}
          userRole={session.user.role || 'USER'}
          userId={userId}
          accessToken={accessToken}
          tenantId={tenantId}
        />
      </Suspense>
    </div>
  );
}
