/**
 * @file auction-view-router.tsx
 * @description Routes to the appropriate auction view based on role and backend status.
 * IMPORTANT: We do NOT override status using the client's clock (prevents desync).
 */
'use client';

import { useCallback } from 'react';
import { Alert, AlertDescription } from '@suba-go/shared-components/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionStatusEnum,
  UserRolesEnum,
} from '@suba-go/shared-validation';

import { useFetchData } from '@/hooks/use-fetch-data';
import { useCompany } from '@/hooks/use-company';

import { AuctionDetailSkeleton } from './auction-detail-skeleton';

import { AuctionManagerActiveView } from './manager-view/auction-manager-active-view';
import { AuctionManagerPendingView } from './manager-view/auction-manager-pending-view';
import { AuctionManagerCompletedView } from './manager-view/auction-manager-completed-view';

import { AuctionActiveBiddingView } from './user-view/auction-active-bidding-view';
import { AuctionPendingView } from './user-view/auction-pending-view';
import { AuctionCompletedView } from './user-view/auction-completed-view';

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
  const { company } = useCompany();
  const primaryColor = company?.principal_color;

  const {
    data: auction,
    isLoading: isLoadingAuction,
    error: errorAuction,
    refetch: refetchAuction,
  } = useFetchData<AuctionDto>({
    url: `/api/auctions/${auctionId}`,
    key: ['auction', auctionId],
    revalidateOnMount: true,
    // With WebSocket, we can reduce polling; still keep a small safety net.
    refreshInterval: 5000,
    dedupingInterval: 1000,
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
    refreshInterval: 5000,
    dedupingInterval: 1000,
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

  // AUCTION_MANAGER view
  if (userRole === UserRolesEnum.AUCTION_MANAGER) {
    switch (auction.status) {
      case AuctionStatusEnum.ACTIVA:
        return (
          <AuctionManagerActiveView
            auction={auction}
            auctionItems={auctionItems}
            accessToken={accessToken}
            tenantId={tenantId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
            primaryColor={primaryColor}
          />
        );

      case AuctionStatusEnum.COMPLETADA:
        return (
          <AuctionManagerCompletedView
            auction={auction}
            auctionItems={auctionItems}
            primaryColor={primaryColor}
          />
        );

      case AuctionStatusEnum.CANCELADA:
      case AuctionStatusEnum.PENDIENTE:
      default:
        return (
          <AuctionManagerPendingView
            auction={auction}
            auctionItems={auctionItems}
            accessToken={accessToken}
            tenantId={tenantId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
            primaryColor={primaryColor}
          />
        );
    }
  }

  // USER view
  if (userRole === UserRolesEnum.USER) {
    switch (auction.status) {
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

      case AuctionStatusEnum.COMPLETADA:
        return (
          <AuctionCompletedView
            auction={auction}
            auctionItems={auctionItems}
            userId={userId}
          />
        );

      case AuctionStatusEnum.CANCELADA:
      case AuctionStatusEnum.PENDIENTE:
      default:
        return (
          <AuctionPendingView
            auction={auction}
            auctionItems={auctionItems}
            accessToken={accessToken}
            tenantId={tenantId}
            onRealtimeSnapshot={handleRealtimeSnapshot}
          />
        );
    }
  }

  // Fallback
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        No tienes permisos para ver esta subasta.
      </AlertDescription>
    </Alert>
  );
}
