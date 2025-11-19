/**
 * @file item-bid-history.tsx
 * @description Simple bid history component for auction items
 */
'use client';

import { TrendingUp, User } from 'lucide-react';
import { ScrollArea } from '@suba-go/shared-components/components/ui/scroll-area';
import { BidWithUserDto } from '@suba-go/shared-validation';

interface ItemBidHistoryProps {
  bids: BidWithUserDto[];
  currentUserId?: string;
  maxItems?: number;
  title?: string;
  maxHeight?: string;
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
}: ItemBidHistoryProps) {
  if (!bids || bids.length === 0) {
    return null;
  }

  // Remove duplicates based on id
  const uniqueBids = bids.reduce((acc, bid) => {
    // If bid has an id, use it for deduplication
    if (bid.id) {
      if (!acc.some((b) => b.id === bid.id)) {
        acc.push(bid);
      }
    } else {
      // Fallback: if no id, use combination of userId + amount + timestamp
      const amount = bid.offered_price || 0;
      if (
        !acc.some((b) => {
          const existingAmount = b.offered_price || 0;
          return b.userId === bid.userId && existingAmount === amount;
        })
      ) {
        acc.push(bid);
      }
    }

    return acc;
  }, [] as BidWithUserDto[]);

  // Sort bids by amount (highest first)
  const sortedBids = [...uniqueBids].sort((a, b) => {
    const amountA = a.offered_price || 0;
    const amountB = b.offered_price || 0;
    return amountB - amountA;
  });

  const displayBids = maxItems ? sortedBids.slice(0, maxItems) : sortedBids;

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        {title}
      </h4>
      <ScrollArea className={`${maxHeight} overflow-y-auto`}>
        <div className="space-y-2">
          {displayBids.map((bid, index) => {
            const amount = bid.offered_price || 0;
            const userName = bid.user?.public_name || 'Usuario';
            const isCurrentUser = bid.userId === currentUserId;
            const isWinning = index === 0;

            // Create unique key based on bid content to avoid duplicates
            const uniqueKey = `${bid.userId || 'unknown'}-${amount}-${index}`;

            return (
              <div
                key={uniqueKey}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  isWinning
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-500" />
                  <span
                    className={
                      isWinning
                        ? 'font-semibold text-green-900'
                        : 'text-gray-700'
                    }
                  >
                    {isCurrentUser ? 'Tú' : userName}
                  </span>
                </div>
                <span
                  className={
                    isWinning
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
