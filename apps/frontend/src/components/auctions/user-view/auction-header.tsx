/**
 * @file auction-header.tsx
 * @description Header component for auction view
 */
'use client';

import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { WsConnectionState } from '@suba-go/shared-validation';

interface AuctionHeaderProps {
  title: string;
  description?: string;
  status: 'ACTIVA' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';

  /** Optional realtime info (WebSocket). */
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

  const wsLabel = (() => {
    if (!wsState) return null;
    switch (wsState) {
      case WsConnectionState.AUTHENTICATED:
        return { label: 'En vivo', className: 'bg-green-600 text-white border-green-600' };
      case WsConnectionState.CONNECTING:
      case WsConnectionState.CONNECTED:
        return { label: 'Conectando…', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case WsConnectionState.DISCONNECTED:
        return { label: 'Desconectado', className: 'bg-gray-100 text-gray-700 border-gray-300' };
      case WsConnectionState.ERROR:
      default:
        return { label: 'Error WS', className: 'bg-red-100 text-red-800 border-red-300' };
    }
  })();

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

        {(wsLabel || typeof participantCount === 'number' || typeof wsRttMs === 'number') ? (
          <div className="flex flex-col items-end gap-1">
            {wsLabel ? (
              <Badge className={`${wsLabel.className} text-[10px] sm:text-xs`}>{wsLabel.label}</Badge>
            ) : null}
            {typeof participantCount === 'number' ? (
              <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] sm:text-xs">
                {participantCount} participantes
              </Badge>
            ) : null}
            {typeof wsRttMs === 'number' ? (
              <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] sm:text-xs">
                RTT {Math.round(wsRttMs)}ms
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
