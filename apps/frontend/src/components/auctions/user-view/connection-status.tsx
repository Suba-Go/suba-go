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
}

export function ConnectionStatus({
  isConnected,
  isJoined,
  participantCount,
}: ConnectionStatusProps) {
  return (
    <Card
      className={
        isConnected
          ? 'border-green-200 bg-green-50'
          : 'border-yellow-200 bg-yellow-50'
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
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
          {isJoined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>
                {participantCount} participante
                {participantCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

