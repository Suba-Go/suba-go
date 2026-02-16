/**
 * @file connection-status.tsx
 * @description WebSocket connection status indicator
 */
'use client';

import { Card, CardContent } from '@suba-go/shared-components/components/ui/card';
import { Wifi, WifiOff, User } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isJoined: boolean;
  participantCount: number;
  /** Round-trip time to the server (ms), as measured by WS PING/PONG. */
  rttMs?: number | null;
}

export function ConnectionStatus({
  isConnected,
  isJoined,
  participantCount,
  rttMs,
}: ConnectionStatusProps) {
  const showRtt = isConnected && typeof rttMs === 'number' && Number.isFinite(rttMs);
  const qualityLabel = !isConnected
    ? 'Sin conexión'
    : typeof rttMs === 'number' && rttMs > 800
      ? 'Inestable'
      : 'En línea';

  return (
    <Card
      className={
        isConnected
          ? 'border-green-200 bg-green-50'
          : 'border-yellow-200 bg-yellow-50'
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-yellow-600" />
            )}
            <span
              className={
                isConnected
                  ? 'text-green-900 font-medium'
                  : 'text-yellow-900 font-medium'
              }
            >
              {isConnected ? 'Conectado en tiempo real' : 'Conectando...'}
            </span>
          </div>

          {/* Inline live stats (same for USER and MANAGER) */}
          <div
            className={
              isConnected
                ? 'flex items-center gap-3 text-green-900'
                : 'flex items-center gap-3 text-yellow-900'
            }
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  !isConnected
                    ? 'bg-yellow-500'
                    : qualityLabel === 'Inestable'
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                }`}
                aria-hidden
              />
              <span className="font-medium">{qualityLabel}</span>
            </div>

            {showRtt ? <span className="text-sm opacity-80">{Math.round(rttMs)}ms</span> : null}

            <div className="flex items-center gap-1 text-sm opacity-90">
              <User className="h-4 w-4" />
              <span>{participantCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

