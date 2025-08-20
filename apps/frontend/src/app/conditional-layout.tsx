'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NavbarLayout from './navbar-layout';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're on a subdomain or login page
    const checkLayout = () => {
      if (typeof window === 'undefined') return;

      // If we're on the login page, don't show navbar/footer
      if (pathname === '/login') {
        setIsSubdomain(true); // Treat login page like a subdomain (no navbar/footer)
        setIsLoading(false);
        return;
      }

      const hostname = window.location.hostname;
      const isLocalhost =
        hostname.includes('localhost') || hostname.includes('127.0.0.1');

      let hasSubdomain = false;

      if (isLocalhost) {
        // Development: check for pattern like "nombre.localhost"
        hasSubdomain =
          hostname.includes('.localhost') && !hostname.startsWith('www.');
      } else {
        // Production: check for pattern like "www.nombre.subago.cl" or "nombre.subago.cl"
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          // Could be www.nombre.subago.cl or nombre.subago.cl
          if (hostname.startsWith('www.') && parts.length >= 4) {
            // www.nombre.subago.cl - has subdomain
            hasSubdomain = true;
          } else if (!hostname.startsWith('www.') && parts.length >= 3) {
            // nombre.subago.cl - has subdomain
            hasSubdomain = true;
          }
        }
      }

      setIsSubdomain(hasSubdomain);
      setIsLoading(false);
    };

    checkLayout();
  }, [pathname]);

  // Show loading state while determining layout
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If we're on a subdomain, render without navbar/footer but keep session context
  if (isSubdomain) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  // Otherwise, render with navbar/footer
  return <NavbarLayout>{children}</NavbarLayout>;
}
