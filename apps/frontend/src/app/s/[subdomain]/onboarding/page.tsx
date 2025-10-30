import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
import ProfileFormWithUserData from '@/components/perfil/profile-form-with-user-data';
import OnboardingGuard from '@/components/perfil/onboarding-guard';

interface OnboardingPageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export async function generateMetadata({
  params,
}: OnboardingPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const normalizedSubdomain = normalizeCompanyName(resolvedParams.subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
    );

    if (companyResponse.success && companyResponse.data) {
      return {
        title: `Onboarding - ${companyResponse.data.name}`,
        description: `Completa tus datos de usuario en ${companyResponse.data.name}`,
      };
    }

    return {
      title: 'Onboarding',
      description: 'Completa tus datos de usuario',
    };
  } catch {
    return {
      title: 'Onboarding',
      description: 'Completa tus datos de usuario',
    };
  }
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  try {
    const resolvedParams = await params;
    const normalizedSubdomain = normalizeCompanyName(resolvedParams.subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
    );

    if (!companyResponse.success || !companyResponse.data) {
      notFound();
    }

    const company = companyResponse.data;

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <OnboardingGuard />
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Completa tu perfil
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <ProfileFormWithUserData
              company={{
                id: company.id,
                name: company.name,
                principal_color: company.principal_color || undefined,
              }}
              hideBackButton
            />
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}