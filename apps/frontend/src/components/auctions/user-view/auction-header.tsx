/**
 * @file auction-header.tsx
 * @description Header component for auction view
 */
'use client';

import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Loader2, Users, Wifi, WifiOff } from 'lucide-react';
import { WsConnectionState } from '@suba-go/shared-validation';

interface AuctionHeaderProps {
  title: string;
  description?: string;
  status: 'ACTIVA' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';

  // Optional realtime indicators.
  wsState?: WsConnectionState;
  wsRttMs?: number;
  participantCount?: number;
}

export function AuctionHeader({
  title,
  description,
  status,
  wsState,
  wsRttMs,
  participantCount,
}: AuctionHeaderProps) {
  const statusConfig = {
    ACTIVA: {
      label: 'Activa',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    PENDIENTE: {
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    COMPLETADA: {
      label: 'Completada',
      className: 'bg-blue-600 text-white border-blue-600',
    },
    CANCELADA: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
  };

  const config = statusConfig[status] || statusConfig.ACTIVA;

  return (
    // Always keep the status badge on the right (especially important on mobile)
    <div className="flex flex-row items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 break-words">
          {title}
        </h1>
        {description ? (
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 break-words">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 pt-1 sm:pt-0 flex flex-col items-end gap-2">
        <Badge className={`${config.className} text-xs sm:text-sm`}>{config.label}</Badge>

        {wsState ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              {wsState === WsConnectionState.AUTHENTICATED ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  <span>En línea</span>
                </>
              ) : wsState === WsConnectionState.CONNECTING ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Conectando</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Sin conexión</span>
                </>
              )}
              {typeof wsRttMs === 'number' && wsState === WsConnectionState.AUTHENTICATED ? (
                <span className="ml-1">{Math.max(0, Math.round(wsRttMs))}ms</span>
              ) : null}
            </div>

            {typeof participantCount === 'number' ? (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="h-3.5 w-3.5" />
                <span>{participantCount}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
