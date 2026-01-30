/**
 * @file auction-completed-item-card.tsx
 * @description Card component for displaying completed auction items with winner/loser indicators
 */
'use client';

import { SafeImage } from '@/components/ui/safe-image';
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

const FALLBACK_IMAGE_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTQwSDYwVjgwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';

function getPrimaryPhoto(photos?: string | null): string | null {
  if (!photos) return null;
  const first = photos
    .split(',')
    .map((u) => u.trim())
    .find(Boolean);
  return first || null;
}

export function AuctionCompletedItemCard({
  auctionItem,
  isWon,
  onViewDetails,
}: AuctionCompletedItemCardProps) {
  const photoUrl = getPrimaryPhoto((auctionItem.item as any)?.photos ?? null);
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

      {/* Product photo */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gray-100">
        <SafeImage
          src={photoUrl || FALLBACK_IMAGE_DATA_URL}
          alt={`${auctionItem.item?.brand ?? 'Producto'} ${auctionItem.item?.model ?? ''}`.trim()}
          fill
          className={photoUrl ? 'object-cover' : 'object-contain p-8 opacity-80'}
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={photoUrl ? 82 : 60}
/>
      </div>

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
        <Button className="w-full" onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
}
