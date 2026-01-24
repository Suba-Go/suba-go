'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@suba-go/shared-components/lib/utils';

type MobileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  side?: 'left' | 'right';
  widthClassName?: string;
  children: ReactNode;
};

export default function MobileDrawer({
  open,
  onOpenChange,
  title,
  side = 'right',
  widthClassName = 'w-[min(88vw,360px)]',
  children,
}: MobileDrawerProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Ensure portal only renders on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <div
      className={cn(
        // Use a very high z-index and portal to avoid being hidden by stacking contexts
        'fixed inset-0 z-[2147483647] md:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={() => onOpenChange(false)}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Panel */}
      <div
        className={cn(
          'absolute top-0 h-full bg-white shadow-2xl transition-transform duration-200 ease-out flex flex-col',
          widthClassName,
          side === 'right' ? 'right-0' : 'left-0',
          open
            ? 'translate-x-0'
            : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="min-w-0">
            {title ? (
              <div className="text-sm font-semibold text-gray-900 truncate">
                {title}
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-900">Menú</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
