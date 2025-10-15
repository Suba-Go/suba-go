'use client';

import NextAuthProvider from '@/components/auth-provider';
import ConditionalLayout from './conditional-layout';
import ProgressBar from '@suba-go/shared-components/components/suba-go/atoms/progress-bar';
import { Toaster } from '@suba-go/shared-components/components/ui/toaster';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProgressBar />
      <NextAuthProvider>
        <NuqsAdapter>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </NuqsAdapter>
      </NextAuthProvider>
    </>
  );
}
