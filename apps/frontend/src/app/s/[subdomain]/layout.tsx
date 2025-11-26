import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
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
    const normalizedSubdomain = normalizeCompanyName(resolvedParams.subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
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
    const normalizedSubdomain = normalizeCompanyName(subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(normalizedSubdomain);

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
    <div 
      className="min-h-screen bg-gray-50 relative"
      style={
        company.background_logo_enabled && company.logo
          ? {
              backgroundImage: `url(${company.logo})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundSize: '40%',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* Overlay to make background logo more subtle */}
      {company.background_logo_enabled && company.logo && (
        <div className="fixed inset-0 bg-gray-50/90 pointer-events-none z-0" />
      )}

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        {/* Company Navbar - Conditionally included (not in login) */}
        <ConditionalNavbar company={company} subdomain={subdomain} />

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
