/**
 * @file auction-live-bids.tsx
 * @description Example component showing live bid updates using WebSocket
 * @author Suba&Go
 */
'use client';

import { useState } from 'react';
import { useAuctionWebSocket } from '@/hooks/use-auction-websocket';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface AuctionLiveBidsProps {
  tenantId: string;
  auctionId: string;
  auctionItemId: string;
  currentHighestBid: number;
  bidIncrement: number;
}

/**
 * Component that displays live bid updates for an auction
 * Uses WebSocket to receive real-time bid notifications
 */
export function AuctionLiveBids({
  tenantId,
  auctionId,
  auctionItemId,
  currentHighestBid,
  bidIncrement,
}: AuctionLiveBidsProps) {
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;
  const [bidAmount, setBidAmount] = useState(currentHighestBid + bidIncrement);

  const {
    bids,
    participantCount,
    placeBid,
    isAuthenticated,
    connectionState,
    error,
  } = useAuctionWebSocket({
    tenantId,
    auctionId,
    enabled: true,
  });

  const handlePlaceBid = () => {
    if (bidAmount < currentHighestBid + bidIncrement) {
      alert(`La puja mínima es $${currentHighestBid + bidIncrement}`);
      return;
    }

    placeBid(auctionItemId, bidAmount);
    
    // Increment for next bid
    setBidAmount(bidAmount + bidIncrement);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Estado de Conexión
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="bg-green-50">
                    Conectado
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline" className="bg-gray-50">
                    {connectionState}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount} participantes conectados</span>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid Placement */}
      <Card>
        <CardHeader>
          <CardTitle>Realizar Puja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Monto de Puja</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                // Allow any amount as long as it's >= the minimum.
                step={1}
                min={currentHighestBid + bidIncrement}
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={!isAuthenticated}
              />
              <Button
                onClick={handlePlaceBid}
                disabled={!isAuthenticated || bidAmount < currentHighestBid + bidIncrement}
                className="text-white"
                style={
                  primaryColor
                    ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (primaryColor) {
                    e.currentTarget.style.backgroundColor = darkenColor(
                      primaryColor,
                      10
                    );
                  }
                }}
                onMouseLeave={(e) => {
                  if (primaryColor) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                Pujar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Puja mínima: {formatCurrency(currentHighestBid + bidIncrement)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBidAmount(currentHighestBid + bidIncrement)}
            >
              Mínimo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBidAmount(currentHighestBid + bidIncrement * 2)}
            >
              +{formatCurrency(bidIncrement)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBidAmount(currentHighestBid + bidIncrement * 5)}
            >
              +{formatCurrency(bidIncrement * 4)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Bids */}
      <Card>
        <CardHeader>
          <CardTitle>Pujas en Vivo</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay pujas aún. ¡Sé el primero en pujar!
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bids.map((bid) => (
                <div
                  key={bid.bidId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {bid.userName || 'Participante'}
                    </p>
                    {bid.item && (
                      <p className="text-xs text-muted-foreground">
                        {bid.item.brand} {bid.item.model} - {bid.item.plate}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(bid.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(bid.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

