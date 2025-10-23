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
      const company = companyResponse.data;

      // Use company logo if available, otherwise fallback to logo-white.png
      const faviconUrl = company.logo || '/logo-white.png';

      return {
        title: company.name,
        description: `Página de ${company.name}`,
        icons: [{ rel: 'icon', url: faviconUrl }],
      };
    }

    return {
      title: 'Empresa',
      description: 'Página de empresa',
      icons: [{ rel: 'icon', url: '/logo-white.png' }],
    };
  } catch {
    return {
      title: 'Empresa',
      description: 'Página de empresa',
      icons: [{ rel: 'icon', url: '/logo-white.png' }],
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
    const companyResponse = await getCompanyBySubdomainServerAction(subdomain);

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
      <ConditionalNavbar company={company} subdomain={subdomain} />

      {/* Contenido de la página */}
      {children}
    </div>
  );
}
