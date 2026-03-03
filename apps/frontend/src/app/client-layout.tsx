'use client';

import NextAuthProvider from '@/components/auth-provider';
import ConditionalLayout from './conditional-layout';
import { Toaster } from '@suba-go/shared-components/components/ui/toaster';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { GlobalNetworkBanner } from '@/components/network/global-network-banner';
import { DemoModalProvider } from '@/contexts/demo-modal-context';
import DemoModal from '@/components/landing/demo-modal';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NextAuthProvider>
        <NuqsAdapter>
          <DemoModalProvider>
            <GlobalNetworkBanner />
            <ConditionalLayout>{children}</ConditionalLayout>
            <DemoModal />
            <Toaster />
          </DemoModalProvider>
        </NuqsAdapter>
      </NextAuthProvider>
    </>
  );
}
