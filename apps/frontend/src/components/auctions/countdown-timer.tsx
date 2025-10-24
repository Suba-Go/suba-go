/**
 * @file countdown-timer.tsx
 * @description Reusable countdown timer component for auctions
 * @author Suba&Go
 */
'use client';

import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@suba-go/shared-components/components/ui/card';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import { AuctionStatusEnum } from '@suba-go/shared-validation';

interface CountdownTimerProps {
  status: string;
  startTime: string | Date;
  endTime: string | Date;
  variant?: 'card' | 'inline' | 'compact';
  className?: string;
}

export function CountdownTimer({
  status,
  startTime,
  endTime,
  variant = 'card',
  className = '',
}: CountdownTimerProps) {
  const auctionStatus = useAuctionStatus(status, startTime, endTime);

  // Don't show timer for completed or cancelled auctions
  if (auctionStatus.isCompleted || auctionStatus.isCanceled) {
    return null;
  }

  // Compact variant - just the time numbers
  if (variant === 'compact' && auctionStatus.timeRemainingDetailed) {
    const { hours, minutes, seconds } = auctionStatus.timeRemainingDetailed;
    const color = auctionStatus.isActive ? 'text-green-700' : 'text-blue-700';
    
    return (
      <div className={`flex gap-1 text-sm font-mono font-bold ${color} ${className}`}>
        <span>{String(hours).padStart(2, '0')}</span>
        <span>:</span>
        <span>{String(minutes).padStart(2, '0')}</span>
        <span>:</span>
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>
    );
  }

  // Inline variant - horizontal layout without card
  if (variant === 'inline' && auctionStatus.timeRemainingDetailed) {
    const { hours, minutes, seconds } = auctionStatus.timeRemainingDetailed;
    const isActive = auctionStatus.isActive;
    const color = isActive ? 'green' : 'blue';
    const Icon = isActive ? Clock : Calendar;
    const label = isActive ? 'Termina en' : 'Inicia en';

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
        <div className="flex-1">
          <p className={`text-sm font-medium text-${color}-900 mb-1`}>{label}</p>
          <div className={`flex gap-2 text-lg font-bold text-${color}-700`}>
            <div className="flex flex-col items-center">
              <span>{String(hours).padStart(2, '0')}</span>
              <span className={`text-xs font-normal text-${color}-600`}>h</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{String(minutes).padStart(2, '0')}</span>
              <span className={`text-xs font-normal text-${color}-600`}>m</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span>{String(seconds).padStart(2, '0')}</span>
              <span className={`text-xs font-normal text-${color}-600`}>s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card variant - full card with detailed countdown (default)
  if (auctionStatus.isActive && auctionStatus.timeRemainingDetailed) {
    const { hours, minutes, seconds } = auctionStatus.timeRemainingDetailed;
    
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-2">
                Subasta Activa - Termina en:
              </h3>
              <div className="flex gap-4 text-2xl font-bold text-green-700">
                <div className="flex flex-col items-center">
                  <span>{String(hours).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-green-600">horas</span>
                </div>
                <span className="text-green-600">:</span>
                <div className="flex flex-col items-center">
                  <span>{String(minutes).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-green-600">minutos</span>
                </div>
                <span className="text-green-600">:</span>
                <div className="flex flex-col items-center">
                  <span>{String(seconds).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-green-600">segundos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auctionStatus.isPending && auctionStatus.timeRemainingDetailed) {
    const { hours, minutes, seconds } = auctionStatus.timeRemainingDetailed;
    
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">
                Subasta Programada - Inicia en:
              </h3>
              <div className="flex gap-4 text-2xl font-bold text-blue-700">
                <div className="flex flex-col items-center">
                  <span>{String(hours).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-blue-600">horas</span>
                </div>
                <span className="text-blue-600">:</span>
                <div className="flex flex-col items-center">
                  <span>{String(minutes).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-blue-600">minutos</span>
                </div>
                <span className="text-blue-600">:</span>
                <div className="flex flex-col items-center">
                  <span>{String(seconds).padStart(2, '0')}</span>
                  <span className="text-xs font-normal text-blue-600">segundos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

