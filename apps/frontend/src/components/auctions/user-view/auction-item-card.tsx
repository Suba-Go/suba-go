/**
 * @file auction-item-card.tsx
 * @description Card component for displaying auction item with bidding interface
 */
'use client';

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
import type { AutoBidSetting } from '@/hooks/use-auto-bid-settings';

interface AuctionItemCardProps {
  auctionItem: any;
  currentHighest: number;
  minNextBid: number;
  bidIncrement: number;
  isUserWinning: boolean;
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

export function AuctionItemCard({
  auctionItem,
  currentHighest,
  minNextBid,
  bidIncrement,
  isUserWinning,
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
          {isUserWinning && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ganando
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
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
          isDisabled={!isJoined}
          onChange={onBidAmountChange}
          onSubmit={onPlaceBid}
        />

        {/* Error Message */}
        {bidState.error && (
          <p className="text-sm text-red-600">{bidState.error}</p>
        )}

        {/* Auto-Bid Toggle */}
        {autoBidSetting && (
          <AutoBidToggle
            enabled={autoBidSetting.enabled}
            maxPrice={autoBidSetting.maxPrice}
            minPrice={minNextBid}
            onToggle={onAutoBidToggle}
            onMaxPriceChange={onAutoBidMaxPriceChange}
          />
        )}

        {/* Bid Increment Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4" />
          <span>Incremento mínimo: {formatCurrency(bidIncrement)}</span>
        </div>

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

        {/* View Details Button */}
        <Button variant="outline" className="w-full" onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
}
