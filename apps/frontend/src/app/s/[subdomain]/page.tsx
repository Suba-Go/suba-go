import type { Metadata } from 'next';
import { protocol, rootDomain } from '@suba-go/shared-components/lib/utils';
import { CustomLink } from '@suba-go/shared-components/components/ui/link';

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

  return (
    <div>
      <div>
        <CustomLink href={`${protocol}://${rootDomain}`}>Home</CustomLink>
      </div>

      <div>
        <div>
          <h1>
            Welcome to {subdomain}.{rootDomain}
          </h1>
          <p>This is your custom subdomain page</p>
        </div>
      </div>
    </div>
  );
}
