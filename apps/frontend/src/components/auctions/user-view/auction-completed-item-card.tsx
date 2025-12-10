/**
 * @file auction-completed-item-card.tsx
 * @description Card component for displaying completed auction items with winner/loser indicators
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
import { Trophy, Eye, XCircle } from 'lucide-react';
import { AuctionItemWithItmeAndBidsDto } from '@suba-go/shared-validation';

interface AuctionCompletedItemCardProps {
  auctionItem: AuctionItemWithItmeAndBidsDto;
  isWon: boolean;
  onViewDetails: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function AuctionCompletedItemCard({
  auctionItem,
  isWon,
  onViewDetails,
}: AuctionCompletedItemCardProps) {
  const highBid = auctionItem.bids?.[0];
  const hasWinner = highBid && Number(highBid.offered_price) > 0;
  const finalPrice = hasWinner
    ? Number(highBid.offered_price)
    : Number(auctionItem.startingBid || 0);

  return (
    <Card
      className={`overflow-hidden transition-all ${
        isWon
          ? 'border-green-500 border-2 shadow-lg'
          : 'opacity-60 border-gray-300'
      }`}
    >
      <CardHeader className={`${isWon ? 'bg-green-50' : 'bg-gray-50'}`}>
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
          {isWon ? (
            <Badge className="bg-green-600 text-white border-green-700">
              <Trophy className="h-3 w-3 mr-1" />
              Ganado
            </Badge>
          ) : (
            <Badge variant="outline" className="border-gray-400 text-gray-600">
              <XCircle className="h-3 w-3 mr-1" />
              No ganado
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Price Info */}
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-600 font-medium mb-1">
            {hasWinner ? 'Precio Final' : 'Precio Base'}
          </p>
          <p
            className={`text-2xl font-bold ${
              isWon ? 'text-green-600' : 'text-gray-700'
            }`}
          >
            {formatCurrency(finalPrice)}
          </p>
        </div>

        {/* Winner Info (if not won by user) */}
        {!isWon && hasWinner && highBid.user && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Ganador</p>
            <p className="text-sm font-semibold text-blue-900">
              {highBid.user.public_name || 'Participante'}
            </p>
          </div>
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
