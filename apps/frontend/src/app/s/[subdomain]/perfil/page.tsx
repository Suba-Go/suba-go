import { Metadata } from 'next';
import { notFound} from 'next/navigation';
import { auth } from '@/auth';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
import ProfileFormWithUserData from '../../../../components/perfil/profile-form-with-user-data';

// Force dynamic rendering to always fetch fresh company data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let subdomain;

  const session = await auth();
  try {
    const resolvedParams = await params;
    subdomain = resolvedParams.subdomain;
    
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
        
        <div className="bg-white rounded-lg shadow p-6">
          <ProfileFormWithUserData 
            company={{
              ...company,
              principal_color: company.principal_color || undefined,
              principal_color2: company.principal_color2 || undefined,
              secondary_color: company.secondary_color || undefined,
              secondary_color2: company.secondary_color2 || undefined,
              secondary_color3: company.secondary_color3 || undefined,
            } as any} 
          />
        </div>
      </div>
    </div>
  );
}
