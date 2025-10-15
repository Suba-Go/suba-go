'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NavbarLayout from './navbar-layout';
import { getSubdomainFromHost } from '@suba-go/shared-components';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'subago.cl';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

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
