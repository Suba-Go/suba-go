/**
 * @file auction-pending-view.tsx
 * @description View for auctions that haven't started yet (PENDIENTE status)
 * @author Suba&Go
 */

'use client';

import { Clock, Calendar, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuctionPendingViewProps {
  auction: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    items?: Array<{
      id: string;
      item?: {
        brand?: string;
        model?: string;
        year?: number;
        plate?: string;
      };
    }>;
  };
}

export function AuctionPendingView({ auction }: AuctionPendingViewProps) {
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);
  const timeUntilStart = formatDistanceToNow(startTime, {
    addSuffix: true,
    locale: es,
  });

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
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Pendiente
        </Badge>
      </div>

      {/* Status Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-5 w-5" />
            Subasta Programada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-lg font-medium">
              Esta subasta comenzará {timeUntilStart}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-yellow-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Inicio</span>
              </div>
              <p className="text-gray-900 text-lg">
                {format(startTime, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Fin Programado</span>
              </div>
              <p className="text-gray-900 text-lg">
                {format(endTime, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-yellow-200">
            <p className="text-yellow-700">
              <strong>Nota:</strong> Podrás comenzar a pujar cuando la subasta
              esté activa. Te recomendamos revisar los vehículos disponibles
              mientras tanto.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items Preview */}
      {auction.items && auction.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehículos en esta Subasta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auction.items.map((auctionItem) => (
                <div
                  key={auctionItem.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <p className="font-semibold text-gray-900">
                    {auctionItem.item?.brand} {auctionItem.item?.model}
                  </p>
                  {auctionItem.item?.year && (
                    <p className="text-sm text-gray-600">
                      Año: {auctionItem.item.year}
                    </p>
                  )}
                  {auctionItem.item?.plate && (
                    <p className="text-sm text-gray-600">
                      Patente: {auctionItem.item.plate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
