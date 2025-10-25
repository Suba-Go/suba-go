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

export function AuctionHeader({ title, description, status }: AuctionHeaderProps) {
  const statusConfig = {
    ACTIVA: { label: 'Activa', className: 'bg-green-100 text-green-800 border-green-300' },
    PENDIENTE: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    COMPLETADA: { label: 'Completada', className: 'bg-gray-100 text-gray-800 border-gray-300' },
    CANCELADA: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-300' },
  };

  const config = statusConfig[status] || statusConfig.ACTIVA;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-2">{description}</p>}
      </div>
      <Badge className={config.className}>{config.label}</Badge>
    </div>
  );
}

