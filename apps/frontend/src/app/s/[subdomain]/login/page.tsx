import CompanyLoginForm from '@/components/auth/company-login-form';
import { Metadata } from 'next';

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
  const company = resolvedParams.subdomain;

  return {
    title: `Iniciar Sesión - ${company}`,
    description: `Accede a tu cuenta en ${company}`,
  };
}

export default async function CompanyLoginPage({
  params,
  searchParams,
}: CompanyLoginPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const company = resolvedParams.subdomain;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 px-4">
        <CompanyLoginForm
          companyName={company}
          prefilledEmail={resolvedSearchParams.email}
        />
      </div>
    </div>
  );
}
