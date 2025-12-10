import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
import ProfileFormWithUserData from '../../../../components/perfil/profile-form-with-user-data';
import { CompanyInformation } from '../../../../components/perfil/company-information';

interface ProfilePageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const normalizedSubdomain = normalizeCompanyName(resolvedParams.subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
    );

    if (companyResponse.success && companyResponse.data) {
      return {
        title: `Perfil - ${companyResponse.data.name}`,
        description: `Gestiona tu perfil en ${companyResponse.data.name}`,
      };
    }

    return {
      title: 'Perfil',
      description: 'Gestiona tu perfil',
    };
  } catch {
    return {
      title: 'Perfil',
      description: 'Gestiona tu perfil',
    };
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  let company;

  try {
    const resolvedParams = await params;
    const subdomain = resolvedParams.subdomain;

    const normalizedSubdomain = normalizeCompanyName(subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Company Information (only for AUCTION_MANAGER) */}
          <CompanyInformation />

          {/* Right Column - User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <ProfileFormWithUserData
              company={{
                id: company.id,
                name: company.name,
                principal_color: company.principal_color || undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
