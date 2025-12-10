/**
 * @file auction-completed-view.tsx
 * @description View for completed auctions (COMPLETADA status)
 * @author Suba&Go
 */

'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Alert,
  AlertDescription,
} from '@suba-go/shared-components/components/ui/alert';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
} from '@suba-go/shared-validation';
import { AuctionCompletedItemCard } from './auction-completed-item-card';
import { AuctionItemDetailModal } from '../auction-item-detail-modal';
import { useCompany } from '@/hooks/use-company';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{auction.title}</h1>
          {auction.description && (
            <p className="text-gray-600 mt-2">{auction.description}</p>
          )}
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Completada
        </Badge>
      </div>

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
              </AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <div className="space-y-2">
                  <p className="text-xl font-bold">
                    No ganaste ningún producto en esta subasta.
                  </p>
                  <p className="text-sm">
                    Puedes ver los detalles de todos los productos a
                    continuación.
                  </p>
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
