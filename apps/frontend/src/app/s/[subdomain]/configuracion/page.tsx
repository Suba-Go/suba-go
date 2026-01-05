import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import CompanySettingsForm from '@/components/subdomain/company-settings-form';

type PageProps = {
  params: Promise<{ subdomain: string }>;
};

export const metadata: Metadata = {
  title: 'Configuración de Empresa',
};

export default async function CompanyConfigPage({ params }: PageProps) {
  const { subdomain } = await params;

  const companyResult = await getCompanyBySubdomainServerAction(subdomain);

  if (!companyResult.success || !companyResult.data) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Configuración de Empresa</h1>
      <p className="text-sm text-gray-600 mb-6">
        Actualiza datos de branding y RUT. Solo administradores o managers
        pueden editar.
      </p>
      <CompanySettingsForm initialData={companyResult.data} />
    </div>
  );
}
