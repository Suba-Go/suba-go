import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';

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
  } catch (error) {
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
    const companyResponse = await getCompanyBySubdomainServerAction(
      resolvedParams.subdomain
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Empresa
              </h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Empresa:</strong> {company.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Rol:</strong> Administrador
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
