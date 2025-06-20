'use client';

import NextAuthProvider from '@/components/auth-provider';
import './global.css';

import NavbarLayout from './navbar-layout';
import ProgressBar from '@suba-go/shared-components/components/suba-go/atoms/progress-bar';
import { Toaster } from '@suba-go/shared-components/components/ui/toaster';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProgressBar />
        <NextAuthProvider>
          <NuqsAdapter>
            <NavbarLayout>{children}</NavbarLayout>
            <Toaster />
          </NuqsAdapter>
        </NextAuthProvider>
      </body>
    </html>
  );
}
