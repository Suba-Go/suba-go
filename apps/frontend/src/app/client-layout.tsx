'use client';

import NextAuthProvider from '@/components/auth-provider';
import ConditionalLayout from './conditional-layout';
import { Toaster } from '@suba-go/shared-components/components/ui/toaster';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { GlobalNetworkBanner } from '@/components/network/global-network-banner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NextAuthProvider>
        <NuqsAdapter>
          <GlobalNetworkBanner />
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </NuqsAdapter>
      </NextAuthProvider>
    </>
  );
}
