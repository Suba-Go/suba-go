'use client';

import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

interface AuctionFinalizingOverlayProps {
  open: boolean;
  title?: string;
  description?: string;
}

export function AuctionFinalizingOverlay({
  open,
  title = 'Finalizando subasta',
  description = 'Estamos calculando resultados y adjudicaciones…',
}: AuctionFinalizingOverlayProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!open) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % 4;
      setDots('.'.repeat(i));
    }, 400);
    return () => clearInterval(timer);
  }, [open]);

  const ariaLabel = useMemo(() => `${title}${dots}`, [title, dots]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="w-[92%] max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Spinner className="size-5" />
          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">
              {title}
              <span className="inline-block w-6">{dots}</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">{description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
