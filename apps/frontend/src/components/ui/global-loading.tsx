'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';

export default function GlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show loading when pathname changes
    setIsLoading(true);

    // Hide loading after a short delay to allow page to render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner className="size-8" />
      </div>
    </div>
  );
}
