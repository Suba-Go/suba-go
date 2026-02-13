/**
 * @file auction-pending-view.tsx
 * @description USER view for pending auctions
 */
'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@suba-go/shared-components/components/ui/alert';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';
import { getPrimaryPhotoUrl } from '@/lib/auction-utils';
import { AlertCircle, Clock, Search } from 'lucide-react';

import { CountdownTimer } from '../countdown-timer';
import { AuctionStartingOverlay } from '../auction-starting-overlay';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { ConnectionStatus } from './connection-status';
import { useAuctionWebSocketBidding } from '@/hooks/use-auction-websocket-bidding';
import { useLiveFallbackSnapshot } from '@/hooks/use-live-fallback-snapshot';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import { useLiveAccessToken } from '@/hooks/use-live-access-token';

interface AuctionPendingViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  accessToken: string;
  tenantId: string;
  onRealtimeSnapshot?: () => void;
}

export function AuctionPendingView({
  auction,
  auctionItems,
  accessToken,
  tenantId,
  onRealtimeSnapshot,
}: AuctionPendingViewProps) {
  const liveAccessToken = useLiveAccessToken(accessToken) ?? accessToken;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const {
    connectionError,
    serverOffsetMs,
    isConnected,
    isJoined,
    participantCount,
    connectionState,
  } = useAuctionWebSocketBidding({
    auctionId: auction.id,
    tenantId,
    accessToken: liveAccessToken,
    onStatusChanged: () => {
      // If auction turns active, parent should refetch and reroute view
      onRealtimeSnapshot?.();
    },
    onSnapshot: (snap) => {
      const nextStatus = (snap as any)?.auction?.status;
      if (typeof nextStatus === 'string' && nextStatus !== auction.status) {
        onRealtimeSnapshot?.();
      }
    },
    onJoined: onRealtimeSnapshot,
  });

  // Fallback HTTP snapshot while WS is reconnecting.
  useLiveFallbackSnapshot({
    enabled: !!onRealtimeSnapshot && (!isConnected || !isJoined),
    onSnapshot: onRealtimeSnapshot,
    intervalMs: 2500,
  });

  // Use a single, server-synced notion of time for all status/timer UI.
  // IMPORTANT: we do not allow bidding until the backend flips the status,
  // but we show a friendly "iniciando" state if startTime already passed.
  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auction.endTime,
    { serverOffsetMs }
  );

  // Safety net: when the start time has passed but the backend hasn't flipped the status yet,
  // aggressively refetch so the user doesn't get stuck on "Iniciando" due to missed WS events
  // or proxy caching. This stops automatically once the parent reroutes to ACTIVA.
  useEffect(() => {
    if (!auctionStatus.isStarting) return;
    const id = setInterval(() => onRealtimeSnapshot?.(), 1000);
    return () => clearInterval(id);
  }, [auctionStatus.isStarting, onRealtimeSnapshot]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return auctionItems;

    return auctionItems.filter((ai) => {
      const item = ai.item as any;
      const haystack = [
        item?.title,
        item?.plate,
        item?.brand,
        item?.model,
        String(item?.year ?? ''),
        item?.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [auctionItems, query]);

  // NOTE: We intentionally do NOT compute a boolean based on Date.now() here, because this component
  // may not re-render at the exact second needed. The overlay itself runs an internal clock and decides
  // when to appear.

  const selectedAuctionItem =
    selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const bidIncrement = Number((auction as any).bidIncrement || 50000);
  const currentHighestBid = selectedAuctionItem
    ? Number((selectedAuctionItem.bids?.[0] as any)?.amount || 0) ||
      Number(selectedAuctionItem.startingBid || 0)
    : 0;

  const getCoverUrl = (ai: AuctionItemWithItmeAndBidsDto) => {
    const item: any = ai.item;
    if (item?.imageUrl) return item.imageUrl as string;
    return getPrimaryPhotoUrl(item?.photos ?? null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AuctionStartingOverlay
        enabled={auction.status === 'PENDIENTE'}
        startTime={auction.startTime}
        serverOffsetMs={serverOffsetMs}
        windowMs={10_000}
        graceMs={5_000}
        title="Iniciando subasta en vivo"
        description="La subasta comenzará en instantes…"
      />
      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <ConnectionStatus
          isConnected={isConnected}
          isJoined={isJoined}
          participantCount={participantCount}
        />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
        <p className="text-gray-600">{auction.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-gray-500 mr-2" />
          <h2 className="text-xl font-semibold">
            {auctionStatus.isStarting ? 'Iniciando subasta…' : 'Subasta pendiente'}
          </h2>
        </div>

        <p className="text-gray-600 mb-6">
          {auctionStatus.isStarting
            ? 'La subasta está iniciando. En un momento se habilitarán las pujas.'
            : 'Esta subasta aún no comienza. Podrás ofertar cuando se active.'}
        </p>

        <CountdownTimer
          status={auction.status}
          startTime={auction.startTime}
          endTime={auction.endTime}
          variant="card"
          serverOffsetMs={serverOffsetMs}
        />
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-bold">
            Autos disponibles ({filteredItems.length})
          </h2>

          <div className="relative w-full sm:w-[360px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por patente, marca, modelo, año..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((auctionItem, idx) => {
            const coverUrl = getCoverUrl(auctionItem);
            const item: any = auctionItem.item;

            return (
              <div
                key={auctionItem.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                <div
                  className="relative aspect-[16/10] bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedIndex(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIndex(idx);
                    }
                  }}
                >
                  {coverUrl ? (
                    <SafeImage
                      src={coverUrl}
                      alt={item?.title || item?.plate || 'Producto'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      quality={82}
                      priority={idx < 3}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {item?.plate ? `${item.plate}` : item?.title || 'Producto'}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {[item?.brand, item?.model, item?.year]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  </div>

                  {item?.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <p className="text-gray-900 font-medium">
                    Precio inicial: ${Number(auctionItem.startingBid || 0).toLocaleString()}
                  </p>

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedIndex(idx)}
                    >
                      Ver imágenes
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/items/${item?.id}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedAuctionItem && (
        <AuctionItemDetailModal
          isOpen={selectedIndex !== null}
          onClose={() => setSelectedIndex(null)}
          auctionItem={selectedAuctionItem}
          currentHighestBid={currentHighestBid}
          bidIncrement={bidIncrement}
          isUserView
          showBidHistory={false}
          fullItemHref={`/items/${(selectedAuctionItem.item as any)?.id}`}
          onPrevItem={() =>
            setSelectedIndex((prev) =>
              prev === null ? 0 : Math.max(0, prev - 1)
            )
          }
          onNextItem={() =>
            setSelectedIndex((prev) => {
              if (prev === null) return 0;
              return Math.min(filteredItems.length - 1, prev + 1);
            })
          }
          hasPrevItem={(selectedIndex ?? 0) > 0}
          hasNextItem={(selectedIndex ?? 0) < filteredItems.length - 1}
        />
      )}
    </div>
  );
}
