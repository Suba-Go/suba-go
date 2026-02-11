/**
 * @file auction-completed-view.tsx
 * @description View for completed auctions (COMPLETADA status)
 * @author Suba&Go
 */

'use client';

import { SafeImage } from '@/components/ui/safe-image';
import { useState } from 'react';
import { Trophy, TrendingUp, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { AuctionHeader } from './auction-header';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';
import { getPrimaryPhotoUrl } from '@/lib/auction-utils';
import { AuctionCompletedItemCard } from './auction-completed-item-card';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { useCompany } from '@/hooks/use-company';

const FALLBACK_IMAGE_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA4MEgxNDBWMTQwSDYwVjgwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';


interface AuctionCompletedViewProps {
  auction: AuctionDto;
  auctionItems: AuctionItemWithItmeAndBidsDto[];
  userId?: string;
}

export function AuctionCompletedView({
  auction,
  userId,
  auctionItems,
}: AuctionCompletedViewProps) {
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<AuctionItemWithItmeAndBidsDto | null>(null);
  const { company: company } = useCompany();
  // Calculate auction statistics
  const totalItems = auctionItems?.length || 0;

  // Count items won by this user
  const itemsWonByUser =
    auctionItems?.filter((item) => item.item?.soldToUserId === userId).length ||
    0;

  // Determine if user is winner or loser
  const isWinner = itemsWonByUser > 0;

  // Pick an item to highlight in the "felicitaciones"/result banner (show product image)
  const getBidderId = (bid: any): string | undefined =>
    bid?.userId || bid?.user_id || bid?.user?.id || bid?.user?.user_id;

  const itemsWon = userId
    ? auctionItems?.filter((it) => it.item?.soldToUserId === userId) || []
    : [];

  const itemsBidByUser = userId
    ? auctionItems?.filter((it) =>
        (it.bids || []).some((b: any) => getBidderId(b) === userId)
      ) || []
    : [];

  const highlightItem: AuctionItemWithItmeAndBidsDto | undefined = isWinner
    ? itemsWon[0]
    : itemsBidByUser
        .slice()
        .sort((a, b) => {
          const aMax = Math.max(
            0,
            ...(a.bids || [])
              .filter((x: any) => getBidderId(x) === userId)
              .map((x: any) => Number(x.offered_price) || 0)
          );
          const bMax = Math.max(
            0,
            ...(b.bids || [])
              .filter((x: any) => getBidderId(x) === userId)
              .map((x: any) => Number(x.offered_price) || 0)
          );
          return bMax - aMax;
        })[0]
    ?? auctionItems?.[0];

  const highlightPhotoUrl = getPrimaryPhotoUrl((highlightItem?.item as any)?.photos ?? null);

  return (
    <div className="space-y-6">
      <AuctionHeader
        title={auction.title}
        description={auction.description || ''}
        status="COMPLETADA"
      />

      {/* Winner/Loser Alert */}
      {userId && (
        <Alert
          className={
            isWinner
              ? 'border-green-500 bg-green-50'
              : 'border-orange-500 bg-orange-50'
          }
        >
          {isWinner ? (
            <>
              <Trophy className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <div className="flex gap-4 items-start">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-white/60 border border-green-200">
                    <SafeImage
                      src={highlightPhotoUrl || FALLBACK_IMAGE_DATA_URL}
                      alt="Producto"
                      fill
                      className={highlightPhotoUrl ? 'object-cover' : 'object-contain p-2 opacity-80'}
                      sizes="96px"
                      quality={highlightPhotoUrl ? 82 : 60}
/>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold">
                      ¡Felicitaciones! Has ganado {itemsWonByUser} de {totalItems}{' '}
                      {itemsWonByUser === 1 ? 'producto' : 'productos'} en esta
                      subasta.
                    </p>
                    <p className="text-sm">
                      Vas a ser contactado dentro de los próximos días por{' '}
                      {company?.name}.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <div className="flex gap-4 items-start">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-white/60 border border-orange-200">
                    <SafeImage
                      src={highlightPhotoUrl || FALLBACK_IMAGE_DATA_URL}
                      alt="Producto"
                      fill
                      className={highlightPhotoUrl ? 'object-cover' : 'object-contain p-2 opacity-80'}
                      sizes="96px"
                      quality={highlightPhotoUrl ? 82 : 60}
/>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold">
                      No ganaste ningún producto en esta subasta.
                    </p>
                    <p className="text-sm">
                      Puedes ver los detalles de todos los productos a
                      continuación.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Results */}
      {auctionItems && auctionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultados de la Subasta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {auctionItems.map((auctionItem) => {
                const userWonItem = auctionItem.item?.soldToUserId === userId;

                return (
                  <AuctionCompletedItemCard
                    key={auctionItem.id}
                    auctionItem={auctionItem}
                    isWon={userWonItem}
                    onViewDetails={() => setSelectedItemForDetail(auctionItem)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Detail Modal */}
      {selectedItemForDetail && (
        <AuctionItemDetailModal
          auctionItem={selectedItemForDetail}
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          currentHighestBid={
            selectedItemForDetail.bids?.[0]
              ? Number(selectedItemForDetail.bids[0].offered_price)
              : Number(selectedItemForDetail.startingBid || 0)
          }
          bidIncrement={Number(auction.bidIncrement || 50000)}
          isUserView={false}
          showBidHistory={true}
        />
      )}
    </div>
  );
}
