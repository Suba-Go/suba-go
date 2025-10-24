/**
 * @file auction-view-router.tsx
 * @description Routes to appropriate auction view based on user role and auction status
 * @author Suba&Go
 */
'use client';

import { useFetchData } from '@/hooks/use-fetch-data';
import { AuctionDetail } from './auction-detail';
import { AuctionActiveBiddingView } from './user-view/auction-active-bidding-view';
import { AuctionPendingView } from './user-view/auction-pending-view';
import { AuctionCompletedView } from './user-view/auction-completed-view';
import { AuctionDetailSkeleton } from './auction-detail-skeleton';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { AuctionData } from '@/types/auction.types';
import { AuctionStatusEnum } from '@suba-go/shared-validation';

interface AuctionViewRouterProps {
  auctionId: string;
  userRole: string;
  userId: string;
  accessToken: string;
  tenantId: string;
}

export function AuctionViewRouter({
  auctionId,
  userRole,
  userId,
  accessToken,
  tenantId,
}: AuctionViewRouterProps) {
  // Fetch auction data
  const {
    data: auction,
    isLoading,
    error,
  } = useFetchData<AuctionData>({
    url: `/api/auctions/${auctionId}`,
    key: ['auction', auctionId],
  });

  if (isLoading) {
    return <AuctionDetailSkeleton />;
  }

  if (error || !auction) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'No se pudo cargar la subasta'}
        </AlertDescription>
      </Alert>
    );
  }

  // AUCTION_MANAGER always sees the management view
  if (userRole === 'AUCTION_MANAGER') {
    return (
      <AuctionDetail
        auctionId={auctionId}
        userRole={userRole}
        userId={userId}
        accessToken={accessToken}
        tenantId={tenantId}
      />
    );
  }

  // USER sees different views based on auction status
  if (userRole === 'USER') {
    // Determine actual status based on time
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    let actualStatus = auction.status;

    // Override status based on time if not cancelled/deleted
    if (
      auction.status !== AuctionStatusEnum.CANCELADA &&
      auction.status !== 'ELIMINADA'
    ) {
      if (now < startTime) {
        actualStatus = AuctionStatusEnum.PENDIENTE;
      } else if (now >= startTime && now < endTime) {
        actualStatus = AuctionStatusEnum.ACTIVA;
      } else {
        actualStatus = AuctionStatusEnum.COMPLETADA;
      }
    }

    // Route to appropriate view
    switch (actualStatus) {
      case AuctionStatusEnum.ACTIVA:
        return (
          <AuctionActiveBiddingView
            auction={auction}
            accessToken={accessToken}
            tenantId={tenantId}
            userId={userId}
          />
        );

      case AuctionStatusEnum.PENDIENTE:
        return <AuctionPendingView auction={auction} />;

      case AuctionStatusEnum.COMPLETADA:
        return <AuctionCompletedView auction={auction} userId={userId} />;

      case AuctionStatusEnum.CANCELADA:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Esta subasta ha sido cancelada</AlertDescription>
          </Alert>
        );

      default:
        return (
          <AuctionDetail
            auctionId={auctionId}
            userRole={userRole}
            userId={userId}
            accessToken={accessToken}
            tenantId={tenantId}
          />
        );
    }
  }

  // Fallback to default view
  return (
    <AuctionDetail
      auctionId={auctionId}
      userRole={userRole}
      userId={userId}
      accessToken={accessToken}
      tenantId={tenantId}
    />
  );
}
