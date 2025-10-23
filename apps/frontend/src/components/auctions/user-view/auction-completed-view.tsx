/**
 * @file auction-completed-view.tsx
 * @description View for completed auctions (COMPLETADA status)
 * @author Suba&Go
 */

'use client';

import { CheckCircle, Trophy, Calendar, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuctionCompletedViewProps {
  auction: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    items?: Array<{
      id: string;
      startingBid: number;
      item: {
        brand?: string;
        model?: string;
        year?: number;
        plate?: string;
      };
      bids?: Array<{
        offered_price: number;
        user?: {
          public_name?: string;
        };
      }>;
    }>;
  };
}

export function AuctionCompletedView({ auction }: AuctionCompletedViewProps) {
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);

  // Calculate auction statistics
  const totalItems = auction.items?.length || 0;
  const itemsWithBids =
    auction.items?.filter((item) => item.bids && item.bids.length > 0).length ||
    0;
  const totalBids =
    auction.items?.reduce((sum, item) => sum + (item.bids?.length || 0), 0) ||
    0;
  const highestBid =
    auction.items?.reduce((max, item) => {
      const itemMax =
        item.bids?.reduce(
          (itemMax, bid) => Math.max(itemMax, bid.offered_price),
          0
        ) || 0;
      return Math.max(max, itemMax);
    }, 0) || 0;

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

      {/* Status Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Subasta Finalizada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-green-700">
            <Trophy className="h-5 w-5" />
            <p className="text-lg font-medium">
              Esta subasta ha finalizado exitosamente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Inicio</span>
              </div>
              <p className="text-gray-900 text-lg">
                {format(startTime, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Finalización</span>
              </div>
              <p className="text-gray-900 text-lg">
                {format(endTime, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>

          {/* Auction Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-green-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-sm text-gray-600">Vehículos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {itemsWithBids}
              </p>
              <p className="text-sm text-gray-600">Con Pujas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalBids}</p>
              <p className="text-sm text-gray-600">Total Pujas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${highestBid.toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-gray-600">Puja Máxima</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {auction.items && auction.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultados de la Subasta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auction.items.map((auctionItem) => {
                const highBid = auctionItem.bids?.[0];
                const hasWinner = highBid && highBid.offered_price > 0;

                return (
                  <div
                    key={auctionItem.id}
                    className="p-4 border rounded-lg bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {auctionItem.item.brand} {auctionItem.item.model}
                        </p>
                        {auctionItem.item.year && (
                          <p className="text-sm text-gray-600">
                            Año: {auctionItem.item.year}
                          </p>
                        )}
                        {auctionItem.item.plate && (
                          <p className="text-sm text-gray-600">
                            Patente: {auctionItem.item.plate}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {hasWinner ? (
                          <>
                            <p className="text-sm text-gray-600">
                              Precio Final
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              ${highBid.offered_price.toLocaleString('es-CL')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ganador:{' '}
                              {highBid.user?.public_name || 'Participante'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">Sin Pujas</p>
                            <p className="text-sm text-gray-500">
                              Precio Base: $
                              {auctionItem.startingBid.toLocaleString('es-CL')}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
