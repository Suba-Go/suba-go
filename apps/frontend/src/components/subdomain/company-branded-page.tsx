'use client';

import { useEffect } from 'react';
import { CompanyDto } from '@suba-go/shared-validation';
import { useSession } from 'next-auth/react';
import { UserHomePage } from './user-home-page';
import { useRouter } from 'next/navigation';

interface CompanyBrandedPageProps {
  company: CompanyDto;
}

export default function CompanyBrandedPage({
  company,
}: CompanyBrandedPageProps) {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();

  // Redirect AUCTION_MANAGER to /subastas using useEffect to avoid render-time navigation
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    if (session && userRole === 'AUCTION_MANAGER') {
      router.push('/subastas');
    }
    // Note: If not logged in, middleware will handle redirect to /login
    // We don't need to redirect here to avoid conflicts
  }, [session, userRole, status, router]);

  // If user is logged in and is a regular USER, show the user home page
  if (session && userRole === 'USER') {
    return <UserHomePage company={company} />;
  }

  return;
}
