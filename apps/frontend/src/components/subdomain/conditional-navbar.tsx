'use client';

import { usePathname } from 'next/navigation';
import CompanyNavbar from './company-navbar';
import { CompanyDto } from '@suba-go/shared-validation';

interface ConditionalNavbarProps {
  company: CompanyDto;
}

export default function ConditionalNavbar({ company }: ConditionalNavbarProps) {
  const pathname = usePathname();

  // Don't show navbar on login page
  const shouldShowNavbar = !pathname.includes('/login');

  if (!shouldShowNavbar) {
    return null;
  }

  return <CompanyNavbar company={company} />;
}
