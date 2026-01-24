/**
 * @file auction-item-card.tsx
 * @description Card component for displaying auction item with bidding interface
 */
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { CheckCircle, Eye, TrendingUp } from 'lucide-react';
import { BidInput } from './bid-input';
import { AutoBidToggle } from './auto-bid-toggle';
import { ItemBidHistory } from './item-bid-history';
import { CountdownTimer } from '../countdown-timer';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import type { AutoBidSetting } from '@/hooks/use-auto-bid-settings';
import { AuctionItemWithItmeAndBidsDto } from '@suba-go/shared-validation';

interface AuctionItemCardProps {
  auctionItem: AuctionItemWithItmeAndBidsDto;
  currentHighest: number;
  minNextBid: number;
  bidIncrement: number;
  isUserWinning: boolean;
  status: string;
  startTime: string | Date;
  endTime: string | Date;
  serverOffsetMs?: number;
  /** Optional externally-provided nowMs (server-synced) to keep all timers in lockstep. */
  nowMs?: number;
  bidState: {
    amount: string;
    isPending: boolean;
    error: string | null;
  };
  autoBidSetting?: AutoBidSetting;
  isJoined: boolean;
  bidHistory?: Array<{
    id: string;
    amount: number;
    userId: string;
    userName?: string;
  }>;
  userId?: string;
  onBidAmountChange: (value: string) => void;
  onPlaceBid: () => void;
  onViewDetails: () => void;
  onAutoBidToggle: () => void;
  onAutoBidMaxPriceChange: (value: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const FALLBACK_IMAGE_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTQwSDYwVjgwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';

function getPrimaryPhoto(photos?: string | null): string | null {
  if (!photos) return null;
  const raw = photos.trim();
  if (!raw) return null;
  return raw.split(',')[0]?.trim() || null;
}

export function AuctionItemCard({
  auctionItem,
  currentHighest,
  minNextBid,
  bidIncrement,
  isUserWinning,
  status,
  startTime,
  endTime,
  serverOffsetMs = 0,
  nowMs,
  bidState,
  autoBidSetting,
  isJoined,
  bidHistory = [],
  userId,
  onBidAmountChange,
  onPlaceBid,
  onViewDetails,
  onAutoBidToggle,
  onAutoBidMaxPriceChange,
}: AuctionItemCardProps) {
  const itemStatus = useAuctionStatus(status, startTime, endTime, { serverOffsetMs, nowMs });
  const isItemEnded = itemStatus.isCompleted || itemStatus.isCanceled;
  const isItemPending = itemStatus.isPending;
  const isItemActive = itemStatus.isActive;

  const photoUrl = getPrimaryPhoto((auctionItem.item as any)?.photos ?? null);

  const disableBidding = !isJoined || !isItemActive;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {auctionItem.item?.plate || 'Sin Patente'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {auctionItem.item?.brand} {auctionItem.item?.model}{' '}
              {auctionItem.item?.year}
            </p>
          </div>
          
  <div className="flex flex-col items-end gap-2">
    {isItemEnded && (
      isUserWinning ? (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ganado
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-gray-200 text-gray-800 border-gray-300"
        >
          Finalizado
        </Badge>
      )
    )}
    {!isItemEnded && isItemPending && (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300">Programado</Badge>
    )}
    <CountdownTimer
      status={status}
      startTime={startTime}
      endTime={endTime}
      serverOffsetMs={serverOffsetMs}
      nowMs={nowMs}
      variant="compact"
      className="px-2 py-1 rounded bg-white/70"
    />
    {!isItemEnded && isUserWinning && (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ganando
      </Badge>
    )}
  </div>
</div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* View Details Button (top, for better UX) */}
        <Button
          className="w-full rounded-full bg-[var(--company-primary)] text-white shadow hover:bg-[var(--company-primary-dark)]"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>

        {/* Product photo (per item) */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={photoUrl || FALLBACK_IMAGE_DATA_URL}
            alt={`${auctionItem.item?.brand ?? 'Producto'} ${auctionItem.item?.model ?? ''}`.trim()}
            fill
            className={photoUrl ? 'object-cover' : 'object-contain p-8 opacity-80'}
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={photoUrl ? 82 : 60}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = FALLBACK_IMAGE_DATA_URL;
            }}
          />
        </div>

        {/* Current Price Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium mb-1">
              Precio Base
            </p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(Number(auctionItem.startingBid || 0))}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium mb-1">
              Puja Actual
            </p>
            <p className="text-lg font-bold text-green-900">
              {formatCurrency(currentHighest)}
            </p>
          </div>
        </div>

        {/* Bid Input */}
        <BidInput
          value={bidState.amount}
          minBid={minNextBid}
          isPending={bidState.isPending}
          isDisabled={disableBidding}
          onChange={onBidAmountChange}
          onSubmit={onPlaceBid}
        />

        {!isItemActive && (
          <p className="text-xs text-gray-600">
            {isItemEnded
              ? 'Este ítem ya finalizó.'
              : 'Este ítem aún no ha iniciado.'}
          </p>
        )}

        {/* Error Message */}
        {bidState.error && (
          <p className="text-sm text-red-600">{bidState.error}</p>
        )}

        {/* Auto-Bid Toggle */}
        {!isItemEnded && autoBidSetting && (
          <AutoBidToggle
            enabled={autoBidSetting.enabled}
            maxPrice={autoBidSetting.maxPrice}
            minPrice={minNextBid}
            onToggle={onAutoBidToggle}
            onMaxPriceChange={onAutoBidMaxPriceChange}
          />
        )}

        {/* Bid Increment Info */}
        {(() => {
          const numericValue = Number(bidState.amount) || 0;
          const isValidBid = numericValue >= minNextBid;
          const textColorClass = isValidBid ? 'text-gray-600' : 'text-red-600';
          const iconClass = `${isValidBid ? '' : 'text-red-600'} h-4 w-4`;

          return (
            <div
              className={`flex items-center gap-2 text-sm ${textColorClass}`}
            >
              <TrendingUp className={iconClass} />
              <span>Incremento mínimo: {formatCurrency(bidIncrement)}</span>
            </div>
          );
        })()}

        {/* Bid History - Show last 5 bids */}
        {(bidHistory.length > 0 ||
          (auctionItem.bids && auctionItem.bids.length > 0)) && (
          <ItemBidHistory
            bids={bidHistory.length > 0 ? bidHistory : auctionItem.bids || []}
            currentUserId={userId}
            maxItems={5}
            title={
              bidHistory.length > 0 ? 'Historial de Pujas' : 'Pujas Anteriores'
            }
            maxHeight="max-h-40"
          />
        )}

      </CardContent>
    </Card>
  );
}
