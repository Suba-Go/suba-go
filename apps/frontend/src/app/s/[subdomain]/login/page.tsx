import CompanyLoginForm from '@/components/auth/company-login-form';
import { Metadata } from 'next';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';

interface CompanyLoginPageProps {
  params: Promise<{
    subdomain: string;
  }>;
  searchParams: Promise<{
    email?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CompanyLoginPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lowerCaseSubdomain = resolvedParams.subdomain.toLowerCase();
  const companyResponse = await getCompanyBySubdomainServerAction(
    lowerCaseSubdomain
  );

  const companyName =
    companyResponse.success && companyResponse.data
      ? companyResponse.data.name
      : 'Suba&Go';

  return {
    title: `Iniciar Sesión - ${companyName}`,
    description: `Accede a tu cuenta en ${companyName}`,
  };
}

export default async function CompanyLoginPage({
  params,
  searchParams,
}: CompanyLoginPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Fetch company data on the server
  const lowerCaseSubdomain = resolvedParams.subdomain.toLowerCase();
  const companyResponse = await getCompanyBySubdomainServerAction(
    lowerCaseSubdomain
  );

  const company =
    companyResponse.success && companyResponse.data
      ? companyResponse.data
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 px-4">
        <CompanyLoginForm
          companyName={company?.name || ''}
          companyNameLowercase={company?.nameLowercase || lowerCaseSubdomain}
          prefilledEmail={resolvedSearchParams.email}
        />
      </div>
    </div>
  );
}
