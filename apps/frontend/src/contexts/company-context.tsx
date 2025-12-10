'use client';

import { createContext, useContext, ReactNode } from 'react';

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

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CompanyContextType;
}) {
  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}

// Optional hook that returns context if available, or undefined if not
export function useCompanyContextOptional() {
  return useContext(CompanyContext);
}

