'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavbarLayout from './navbar-layout';
import { getSubdomainFromHost, getNodeEnv } from '@suba-go/shared-components';
import { CompanyProvider } from '@/contexts/company-context';
import ProgressBar from '@suba-go/shared-components/components/suba-go/atoms/progress-bar';
import { useCompanyContextOptional } from '@/contexts/company-context';

interface Company {
  id: string;
  name: string;
  logo?: string;
  principal_color?: string;
  principal_color2?: string;
  secondary_color?: string;
  secondary_color2?: string;
  secondary_color3?: string;
  tenantId: string;
}

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
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
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
    let domain = ROOT_DOMAIN;
    if (host.includes('development.subago.cl')) {
      domain = 'development.subago.cl';
    }
    const subdomain = getSubdomainFromHost(host, domain);
    setIsSubdomain(subdomain !== null);
    setIsLoading(false);
  }, [pathname]);

  // Load company data when in subdomain and user is logged in
  useEffect(() => {
    if (!isSubdomain || !session?.user?.company?.id) {
      setCompany(null);
      setIsLoadingCompany(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        setIsLoadingCompany(true);
        setCompanyError(null);

        const response = await fetch(
          `/api/companies/${session.user.company.id}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar la empresa');
        }

        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setCompanyError(
          err instanceof Error ? err.message : 'Error desconocido'
        );
        console.error('Error loading company:', err);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompany();
  }, [isSubdomain, session?.user?.company?.id]);

  // Global client-side trap to keep user in onboarding if profile is incomplete
  // Only applies when inside a subdomain (not on root domain)
  useEffect(() => {
    if (status === 'loading' || isLoading) return;
    // Only enforce onboarding guard when inside a subdomain
    if (!isSubdomain) return;

    // Only redirect to onboarding if user is logged in but profile is incomplete
    // If user is not logged in, let middleware handle redirect to /login
    if (!session) return;

    const user = session.user;
    const isIncomplete =
      !user ||
      !user.name ||
      user.name.trim().length < 3 ||
      !user.phone ||
      !user.rut;
    if (isIncomplete && pathname !== '/onboarding' && pathname !== '/login') {
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

  // Get primary color for progress bar
  const primaryColor = company?.principal_color || '#FCD34D';

  // Tenants sin navbar/footer; root domain con navbar
  if (isSubdomain) {
    return (
      <CompanyProvider
        value={{
          company,
          isLoading: isLoadingCompany,
          error: companyError,
        }}
      >
        <ProgressBarWrapper color={primaryColor} height="5px" />
        <div className="min-h-screen flex flex-col">{children}</div>
      </CompanyProvider>
    );
  }

  return (
    <>
      <ProgressBar color="#FCD34D" height="5px" />
      <NavbarLayout>{children}</NavbarLayout>
    </>
  );
}

// Wrapper component to access company context inside CompanyProvider
function ProgressBarWrapper({
  color: colorProp,
  height,
}: {
  color?: string;
  height?: string;
}) {
  const companyContext = useCompanyContextOptional();
  const companyColor = companyContext?.company?.principal_color;
  const color = colorProp || companyColor || '#FCD34D';

  return <ProgressBar color={color} height={height} />;
}
