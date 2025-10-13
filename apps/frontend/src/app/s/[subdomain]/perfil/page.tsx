import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import ProfileFormWithUserData from './profile-form-with-user-data';

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
    const companyResponse = await getCompanyBySubdomainServerAction(
      resolvedParams.subdomain
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
  let userRole = 'Usuario';

  try {
    const resolvedParams = await params;
    subdomain = resolvedParams.subdomain;
    
    // Obtener la sesión del usuario
    const session = await auth();
    if (session?.user?.role) {
      userRole = session.user.role;
    }
    
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

  // Función para convertir el rol a texto legible
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'AUCTION_MANAGER':
        return 'Gestor de Subastas';
      case 'USER':
        return 'Usuario';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda - Información de la Empresa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-4">
              Información de la Empresa
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {company.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdominio
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {subdomain || 'No especificado'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del Usuario
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {getRoleLabel(userRole)}
                </div>
              </div>
              
              {company.principal_color && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Principal
                  </label>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: company.principal_color }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {company.principal_color}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Información del Usuario */}
          <div className="bg-white rounded-lg shadow p-6">
            <ProfileFormWithUserData 
              company={{
                id: company.id,
                name: company.name,
                principal_color: company.principal_color || undefined
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
