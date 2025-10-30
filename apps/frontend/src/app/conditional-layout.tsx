'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavbarLayout from './navbar-layout';
import { getSubdomainFromHost, getNodeEnv } from '@suba-go/shared-components';

// Determine ROOT_DOMAIN based on APP_ENV
const APP_ENV = getNodeEnv();
const ROOT_DOMAIN =
  APP_ENV === 'local'
    ? 'localhost:3000'
    : APP_ENV === 'development'
    ? 'development.subago.cl'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'subago.cl';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Hide navbar on any login page (global or tenant-specific)
    if (pathname === '/login' || pathname.endsWith('/login')) {
      setIsSubdomain(false);
      setIsLoading(false);
      return;
    }

    const host = window.location.host; // includes port if present
    const subdomain = getSubdomainFromHost(host, ROOT_DOMAIN);
    setIsSubdomain(subdomain !== null);
    setIsLoading(false);
  }, [pathname]);

  // Global client-side trap to keep user in onboarding if profile is incomplete
  // Only applies when inside a subdomain (not on root domain)
  useEffect(() => {
    if (status === 'loading' || isLoading) return;
    // Only enforce onboarding guard when inside a subdomain
    if (!isSubdomain) return;
    
    const user = session?.user;
    const isIncomplete = !user || !user.name || user.name.trim().length < 3 || !user.phone || !user.rut;
    if (isIncomplete && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [status, session, pathname, router, isSubdomain, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Tenants sin navbar/footer; root domain con navbar
  if (isSubdomain)
    return <div className="min-h-screen flex flex-col">{children}</div>;

  return <NavbarLayout>{children}</NavbarLayout>;
}
