'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getSubdomainFromHost, getNodeEnv } from '@suba-go/shared-components';

// Determine ROOT_DOMAIN based on APP_ENV
const APP_ENV = getNodeEnv();
const ROOT_DOMAIN =
  APP_ENV === 'local'
    ? 'localhost:3000'
    : APP_ENV === 'development'
    ? 'development.subago.cl'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'subago.cl';

export default function OnboardingGuard() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.host;
    const subdomain = getSubdomainFromHost(host, ROOT_DOMAIN);
    setIsSubdomain(subdomain !== null);
  }, []);

  useEffect(() => {
    // Only enforce guard when inside a subdomain
    if (!isSubdomain) return;

    const user = session?.user;
    const isIncomplete = !user || !user.name || user.name.trim().length < 3 || !user.phone || !user.rut;

    if (isIncomplete) {
      // Stay pinned to public onboarding route (middleware reescribe al subdominio)
      if (pathname !== '/onboarding') {
        router.replace('/onboarding');
      }

      // Trap back navigation while incomplete
      const onPopState = () => {
        router.replace('/onboarding');
      };
      window.addEventListener('popstate', onPopState);
      return () => window.removeEventListener('popstate', onPopState);
    }
  }, [session, pathname, router, isSubdomain]);

  return null;
}


