/**
 * @file auction-header.tsx
 * @description Header component for auction view
 */
'use client';

import { Badge } from '@suba-go/shared-components/components/ui/badge';

interface AuctionHeaderProps {
  title: string;
  description?: string;
  status: 'ACTIVA' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
}

export function AuctionHeader({
  title,
  description,
  status,
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
      <div className="shrink-0 pt-1 sm:pt-0">
        <Badge className={`${config.className} text-xs sm:text-sm`}>{config.label}</Badge>
      </div>
    </div>
  );
}
