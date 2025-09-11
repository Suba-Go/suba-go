'use client';

import { usePathname } from 'next/navigation';
import CompanyNavbar from './company-navbar';

interface ConditionalNavbarProps {
  company: {
    id: string;
    name: string;
    principal_color?: string;
  };
  subdomain: string;
}

export default function ConditionalNavbar({ company, subdomain }: ConditionalNavbarProps) {
  const pathname = usePathname();
  
  // No mostrar navbar en la página de login
  const shouldShowNavbar = !pathname.includes('/login');
  
  if (!shouldShowNavbar) {
    return null;
  }
  
  return (
    <CompanyNavbar 
      company={company}
      subdomain={subdomain} 
    />
  );
}
