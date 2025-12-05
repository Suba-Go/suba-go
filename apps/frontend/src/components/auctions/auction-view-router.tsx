/**
 * @file auction-view-router.tsx
 * @description Routes to appropriate auction view based on user role and auction status
 * @author Suba&Go
 */
'use client';

import { useCallback } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { AuctionDetail } from './auction-detail';
import { AuctionActiveBiddingView } from './user-view/auction-active-bidding-view';
import { AuctionPendingView } from './user-view/auction-pending-view';
import { AuctionCompletedView } from './user-view/auction-completed-view';
import { AuctionManagerActiveView } from './manager-view/auction-manager-active-view';
import { AuctionManagerPendingView } from './manager-view/auction-manager-pending-view';
import { AuctionManagerCompletedView } from './manager-view/auction-manager-completed-view';
import { AuctionDetailSkeleton } from './auction-detail-skeleton';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionStatusEnum,
  UserRolesEnum,
} from '@suba-go/shared-validation';

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
    isLoading: isLoadingAuction,
    error: errorAuction,
    refetch: refetchAuction,
  } = useFetchData<AuctionDto>({
    url: `/api/auctions/${auctionId}`,
    key: ['auction', auctionId],
    revalidateOnMount: true,
    refreshInterval: 600,
    dedupingInterval: 0,
  });

  const {
    data: auctionItems,
    isLoading: isLoadingAuctionItems,
    error: errorAuctionItems,
    refetch: refetchAuctionItems,
  } = useFetchData<AuctionItemWithItmeAndBidsDto[]>({
    url: `/api/auction-items/${auctionId}`,
    key: ['auctionItems', auctionId],
    revalidateOnMount: true,
    refreshInterval: 600,
    dedupingInterval: 0,
  });

  const handleRealtimeSnapshot = useCallback(() => {
    refetchAuction();
    refetchAuctionItems();
  }, [refetchAuction, refetchAuctionItems]);

  if (isLoadingAuction || isLoadingAuctionItems) {
    return <AuctionDetailSkeleton />;
  }

  if (errorAuction || errorAuctionItems || !auction || !auctionItems) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{'No se pudo cargar la subasta'}</AlertDescription>
      </Alert>
    );
  }

  // AUCTION_MANAGER always sees the management view
  if (userRole === UserRolesEnum.AUCTION_MANAGER) {
    // Determine actual status based on time (same logic as user)
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    let actualStatus = auction.status;

    // Override status based on time if not cancelled/deleted
    if (
      auction.status !== AuctionStatusEnum.CANCELADA &&
      auction.status !== AuctionStatusEnum.ELIMINADA
    ) {
      if (now < startTime) {
        actualStatus = AuctionStatusEnum.PENDIENTE;
      } else if (now >= startTime && now < endTime) {
        actualStatus = AuctionStatusEnum.ACTIVA;
      } else {
        actualStatus = AuctionStatusEnum.COMPLETADA;
      }
    }

    switch (actualStatus) {
      case AuctionStatusEnum.ACTIVA:
        return (
          <AuctionManagerActiveView
            auction={auction}
            auctionItems={auctionItems}
            accessToken={accessToken}
            tenantId={tenantId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
            userRole={userRole}
            userId={userId}
          />
        );
      case AuctionStatusEnum.PENDIENTE:
        return (
          <AuctionManagerPendingView
            auction={auction}
            auctionItems={auctionItems}
          />
        );
      case AuctionStatusEnum.COMPLETADA:
        return (
          <AuctionManagerCompletedView
            auction={auction}
            auctionItems={auctionItems}
          />
        );
      case AuctionStatusEnum.CANCELADA:
        return (
          <AuctionManagerPendingView
            auction={auction}
            auctionItems={auctionItems}
          />
        );
      default:
        return (
          <AuctionManagerPendingView
            auction={auction}
            auctionItems={auctionItems}
          />
        );
    }
  }

  // USER sees different views based on auction status
  if (userRole === UserRolesEnum.USER) {
    // Determine actual status based on time
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    let actualStatus = auction.status;

    // Override status based on time if not cancelled/deleted
    if (
      auction.status !== AuctionStatusEnum.CANCELADA &&
      auction.status !== AuctionStatusEnum.ELIMINADA
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
            auctionItems={auctionItems}
            accessToken={accessToken}
            tenantId={tenantId}
            userId={userId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
          />
        );

      case AuctionStatusEnum.PENDIENTE:
        return (
          <AuctionPendingView auction={auction} auctionItems={auctionItems} />
        );

      case AuctionStatusEnum.COMPLETADA:
        return (
          <AuctionCompletedView
            auction={auction}
            auctionItems={auctionItems}
            userId={userId}
          />
        );

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
            auction={auction}
            auctionItems={auctionItems}
            userRole={userRole}
            userId={userId}
            accessToken={accessToken}
            tenantId={tenantId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
          />
        );
    }
  }

  // Fallback to default view
  return (
    <AuctionDetail
      auction={auction}
      auctionItems={auctionItems}
      userRole={userRole}
      userId={userId}
      accessToken={accessToken}
      tenantId={tenantId}
      onRealtimeSnapshot={handleRealtimeSnapshot}
    />
  );
}
