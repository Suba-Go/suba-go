import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import ConditionalNavbar from '@/components/subdomain/conditional-navbar';

interface SubdomainLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    subdomain: string;
  }>;
}

export async function generateMetadata({
  params,
}: SubdomainLayoutProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const companyResponse = await getCompanyBySubdomainServerAction(
      resolvedParams.subdomain
    );

    if (companyResponse.success && companyResponse.data) {
      return {
        title: companyResponse.data.name,
        description: `Página de ${companyResponse.data.name}`,
      };
    }

    return {
      title: 'Empresa',
      description: 'Página de empresa',
    };
  } catch {
    return {
      title: 'Empresa',
      description: 'Página de empresa',
    };
  }
}

export default async function SubdomainLayout({
  children,
  params,
}: SubdomainLayoutProps) {
  let company;
  let subdomain;

  try {
    const resolvedParams = await params;
    subdomain = resolvedParams.subdomain;
    const companyResponse = await getCompanyBySubdomainServerAction(
      subdomain
    );

    if (!companyResponse.success || !companyResponse.data) {
      console.error('Company not found:', companyResponse.error);
      notFound();
    }

    company = companyResponse.data;
  } catch (error) {
    console.error('Error fetching company:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Navbar - Condicionalmente incluida (no en login) */}
      <ConditionalNavbar 
        company={{
          id: company.id,
          name: company.name,
          principal_color: company.principal_color || undefined
        }} 
        subdomain={subdomain} 
      />
      
      {/* Contenido de la página */}
      {children}
    </div>
  );
}
