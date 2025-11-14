import type { Metadata } from 'next';
import { rootDomain } from '@suba-go/shared-components/lib/utils';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
import { notFound } from 'next/navigation';
import CompanyBrandedPage from '@/components/subdomain/company-branded-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;

  return {
    title: `${subdomain}.${rootDomain}`,
    description: `Subdomain page for ${subdomain}.${rootDomain}`,
  };
}

export default async function SubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // Get company data for this subdomain
  const normalizedSubdomain = normalizeCompanyName(subdomain);
  const companyResult = await getCompanyBySubdomainServerAction(
    normalizedSubdomain
  );

  if (!companyResult.success || !companyResult.data) {
    notFound();
  }

  const company = companyResult.data;

  return <CompanyBrandedPage company={company} />;
}
