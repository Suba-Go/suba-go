/**
 * @file item-bid-history.tsx
 * @description Simple bid history component for auction items
 */
'use client';

import { TrendingUp, User } from 'lucide-react';
import { ScrollArea } from '@suba-go/shared-components/components/ui/scroll-area';

type AnyBid = {
  id?: string;
  offered_price?: number;
  amount?: number;
  userId?: string;
  userName?: string;
  bid_time?: string | Date;
  createdAt?: string | Date;
  user?: {
    public_name?: string | null;
    email?: string | null;
  };
};

interface ItemBidHistoryProps {
  bids: AnyBid[];
  currentUserId?: string;
  maxItems?: number;
  title?: string;
  maxHeight?: string;
  /**
   * Sorting mode:
   * - 'highest': sort by amount DESC (default, used for "Ganando"/highest-bid UX)
   * - 'recent': sort by time DESC (used for chronological history lists)
   */
  sortMode?: 'highest' | 'recent';
  /**
   * When true, prefer real user names (AUCTION_MANAGER / ADMIN views).
   * When false, show only pseudonyms (USER view).
   */
  showRealNames?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ItemBidHistory({
  bids,
  currentUserId,
  maxItems,
  title = 'Historial de Pujas',
  maxHeight = 'max-h-40',
  sortMode = 'highest',
  showRealNames = false,
}: ItemBidHistoryProps) {
  if (!bids || bids.length === 0) {
    return null;
  }

  // Remove duplicates based on id
  const uniqueBids = bids.reduce((acc, bid) => {
    const amount = bid.offered_price ?? bid.amount ?? 0;
    const ts =
      (bid as { timestamp?: number }).timestamp ??
      (bid.bid_time ? new Date(bid.bid_time).getTime() : undefined) ??
      (bid.createdAt ? new Date(bid.createdAt).getTime() : undefined);

    if (bid.id) {
      if (!acc.some((b) => b.id === bid.id)) acc.push({ ...bid, amount, ts });
    } else if (bid.userId) {
      if (
        !acc.some(
          (b) =>
            b.userId === bid.userId &&
            (b.offered_price ?? (b as AnyBid).amount ?? 0) === amount
        )
      ) {
        acc.push({ ...bid, amount, ts });
      }
    } else {
      acc.push({ ...bid, amount, ts });
    }

    return acc;
  }, [] as (AnyBid & { amount: number; ts?: number })[]);

  const sortedBids = [...uniqueBids].sort((a, b) => {
    if (sortMode === 'recent') {
      return (b.ts ?? 0) - (a.ts ?? 0);
    }
    const amountA = a.amount ?? a.offered_price ?? 0;
    const amountB = b.amount ?? b.offered_price ?? 0;
    if (amountB !== amountA) return amountB - amountA;
    return (b.ts ?? 0) - (a.ts ?? 0);
  });

  const displayBids = maxItems ? sortedBids.slice(0, maxItems) : sortedBids;

  return (
    <div className="border-t pt-4">
      <h4
        className={`text-sm font-medium mb-2 flex items-center gap-2 ${
          sortMode === 'recent' ? 'text-green-700' : 'text-gray-700'
        }`}
      >
        <TrendingUp className="h-4 w-4" />
        {title}
      </h4>
      <ScrollArea className={`${maxHeight} overflow-y-auto`}>
        <div className="space-y-2">
          {displayBids.map((bid, index) => {
            const amount = bid.amount ?? bid.offered_price ?? 0;
            // USER view: show only pseudonym
            // Manager/Admin view: show real name (or email fallback)
            const userName = showRealNames
              ? (bid.user as any)?.name ||
                bid.user?.email ||
                bid.user?.public_name ||
                bid.userName ||
                'Usuario'
              : bid.user?.public_name || bid.userName || 'Usuario';
            const isCurrentUser = bid.userId === currentUserId;
            // Keep the same green highlight UX for the most relevant entry.
            // - highest: top row is the current winning bid
            // - recent: top row is the most recent bid
            const isHighlighted = index === 0;

            // Create unique key based on bid content to avoid duplicates
            const uniqueKey = bid.id
              ? bid.id
              : `${bid.userId || 'unknown'}-${amount}-${index}`;

            return (
              <div
                key={uniqueKey}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  isHighlighted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-500" />
                  <span
                    className={
                      isHighlighted
                        ? 'font-semibold text-green-900'
                        : 'text-gray-700'
                    }
                  >
                    {isCurrentUser ? 'Tú' : userName}
                  </span>
                </div>
                <span
                  className={
                    isHighlighted
                      ? 'font-bold text-green-900'
                      : 'font-medium text-gray-900'
                  }
                >
                  {formatCurrency(amount)}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
