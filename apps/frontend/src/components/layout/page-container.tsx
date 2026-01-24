'use client';

import React from 'react';

/**
 * PageContainer
 * - Consistent spacing across the app
 * - Mobile-first paddings
 * - Adds bottom safe-area padding for iOS (home indicator)
 */
export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(env(safe-area-inset-bottom)+24px)] ${className}`}
    >
      {children}
    </main>
  );
}
