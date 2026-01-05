import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClientFeedbackTabs from '@/components/feedback/feedback-tabs-wrapper';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const session = await auth();
  const { subdomain } = await params;

  // Only AUCTION_MANAGER can access this page
  if (!session || session.user.role !== 'AUCTION_MANAGER') {
    redirect(`/s/${subdomain}`);
  }

  // Fetch company data to get colors
  const normalizedSubdomain = normalizeCompanyName(subdomain);
  const companyResponse = await getCompanyBySubdomainServerAction(
    normalizedSubdomain
  );

  const company = companyResponse.success ? companyResponse.data : null;
  const primaryColor = company?.principal_color || '#3B82F6'; // Default to blue if no color

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-gray-900 mb-2"
          style={{ color: primaryColor }}
        >
          Feedback para el equipo de Suba&Go
        </h1>
        <p className="text-gray-600">
          Comparte tus comentarios, sugerencias, consejos o críticas con nuestro
          equipo. Tu opinión nos ayuda a mejorar la plataforma.
        </p>
      </div>

      <ClientFeedbackTabs primaryColor={primaryColor} />
    </div>
  );
}
