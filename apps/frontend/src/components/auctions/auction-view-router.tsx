/**
 * @file auction-view-router.tsx
 * @description Routes to the appropriate auction view based on role and backend status.
 * IMPORTANT: We do NOT override status using the client's clock (prevents desync).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // --- Offline-friendly UX ---
  // Keep the last known good snapshot so the page doesn't "die" on temporary network loss.
  const storageKeyAuction = useMemo(() => `auction:last:${auctionId}`, [auctionId]);
  const storageKeyItems = useMemo(() => `auction:lastItems:${auctionId}`, [auctionId]);

  const [lastAuction, setLastAuction] = useState<AuctionDto | null>(null);
  const [lastAuctionItems, setLastAuctionItems] =
    useState<AuctionItemWithItmeAndBidsDto[] | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Persist last good data (in-memory + sessionStorage) for mobile offline scenarios.
  useEffect(() => {
    if (auction) {
      setLastAuction(auction);
      try {
        sessionStorage.setItem(storageKeyAuction, JSON.stringify(auction));
      } catch {
        // ignore
      }
    }
  }, [auction, storageKeyAuction]);

  useEffect(() => {
    if (auctionItems) {
      setLastAuctionItems(auctionItems);
      try {
        sessionStorage.setItem(storageKeyItems, JSON.stringify(auctionItems));
      } catch {
        // ignore
      }
    }
  }, [auctionItems, storageKeyItems]);

  // Load cached snapshot on mount (useful if user goes offline after having joined before).
  useEffect(() => {
    try {
      const a = sessionStorage.getItem(storageKeyAuction);
      const i = sessionStorage.getItem(storageKeyItems);
      if (!lastAuction && a) setLastAuction(JSON.parse(a));
      if (!lastAuctionItems && i) setLastAuctionItems(JSON.parse(i));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKeyAuction, storageKeyItems]);

  // Track online/offline and refetch immediately when coming back online.
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      handleRealtimeSnapshot();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [handleRealtimeSnapshot]);

  const hasNetworkError = !!(errorAuction || errorAuctionItems);
  const showOfflineBanner = !isOnline || hasNetworkError;

  // Use live data if present; otherwise fall back to cached snapshot.
  const effectiveAuction = auction ?? lastAuction;
  const effectiveAuctionItems = auctionItems ?? lastAuctionItems;

  if (isLoadingAuction || isLoadingAuctionItems) {
    return <AuctionDetailSkeleton />;
  }

  // If we have *no* snapshot to render (first load offline), show a friendly offline state.
  if (
    (!effectiveAuction || !effectiveAuctionItems) &&
    (errorAuction || errorAuctionItems || !isOnline)
  ) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {!isOnline
            ? 'Sin conexión. Intentando reconectar…'
            : 'No se pudo cargar la subasta'}
        </AlertDescription>
      </Alert>
    );
  }

  // At this point we can render using either live or cached snapshot.
  const auctionToRender = effectiveAuction as AuctionDto;
  const itemsToRender = effectiveAuctionItems as AuctionItemWithItmeAndBidsDto[];

  const OfflineBanner = showOfflineBanner ? (
    <div className="mb-3">
      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {!isOnline
            ? 'Sin conexión. Mostrando la última información disponible. Reintentando…'
            : 'Conexión inestable. Reintentando sincronización…'}
        </AlertDescription>
      </Alert>
    </div>
  ) : null;

  // AUCTION_MANAGER view
  if (userRole === UserRolesEnum.AUCTION_MANAGER) {
    switch (auctionToRender.status) {
      case AuctionStatusEnum.ACTIVA:
        return (
          <>
            {OfflineBanner}
            <AuctionManagerActiveView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              accessToken={accessToken}
              tenantId={tenantId}
              onRealtimeSnapshot={handleRealtimeSnapshot}
              primaryColor={primaryColor}
            />
          </>
        );

      case AuctionStatusEnum.COMPLETADA:
        return (
          <>
            {OfflineBanner}
            <AuctionManagerCompletedView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              primaryColor={primaryColor}
            />
          </>
        );

      case AuctionStatusEnum.CANCELADA:
      case AuctionStatusEnum.PENDIENTE:
      default:
        return (
          <>
            {OfflineBanner}
            <AuctionManagerPendingView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              accessToken={accessToken}
              tenantId={tenantId}
              onRealtimeSnapshot={handleRealtimeSnapshot}
              primaryColor={primaryColor}
            />
          </>
        );
    }
  }

  // USER view
  if (userRole === UserRolesEnum.USER) {
    switch (auctionToRender.status) {
      case AuctionStatusEnum.ACTIVA:
        return (
          <>
            {OfflineBanner}
            <AuctionActiveBiddingView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              accessToken={accessToken}
              tenantId={tenantId}
              userId={userId}
              onRealtimeSnapshot={handleRealtimeSnapshot}
            />
          </>
        );

      case AuctionStatusEnum.COMPLETADA:
        return (
          <>
            {OfflineBanner}
            <AuctionCompletedView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              userId={userId}
            />
          </>
        );

      case AuctionStatusEnum.CANCELADA:
      case AuctionStatusEnum.PENDIENTE:
      default:
        return (
          <>
            {OfflineBanner}
            <AuctionPendingView
              auction={auctionToRender}
              auctionItems={itemsToRender}
              accessToken={accessToken}
              tenantId={tenantId}
              onRealtimeSnapshot={handleRealtimeSnapshot}
            />
          </>
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
