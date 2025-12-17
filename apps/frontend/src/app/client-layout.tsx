'use client';

import NextAuthProvider from '@/components/auth-provider';
import ConditionalLayout from './conditional-layout';
import { Toaster } from '@suba-go/shared-components/components/ui/toaster';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NextAuthProvider>
        <NuqsAdapter>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </NuqsAdapter>
      </NextAuthProvider>
    </>
  );
}
