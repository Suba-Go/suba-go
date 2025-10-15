/**
 * Extracts subdomain from host across different environments:
 * - Local: acme.localhost:3000 → acme
 * - Vercel Preview: acme---suba-go-git-branch-owner.vercel.app → acme
 * - Vercel Main: acme.suba-go.vercel.app → acme
 * - Production: acme.suba-go.cl → acme
 */
export function getSubdomainFromHost(
  host: string,
  rootDomain: string
): string | null {
  const hostname = host.split(':')[0]; // Remove port

  // No subdomain for root domain or www
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;

  // Local development: acme.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub && sub !== 'www' ? sub : null;
  }

  // Vercel preview deploys: acme---suba-go-git-branch-owner.vercel.app
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const sub = hostname.split('---')[0];
    return sub || null;
  }

  // Vercel main deploy: acme.suba-go.vercel.app
  if (hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('.');
    // If there are more than 3 parts (subdomain.app-name.vercel.app), extract subdomain
    if (parts.length > 3) {
      return parts[0];
    }
    return null;
  }

  // Production: acme.suba-go.cl or acme.{rootDomain}
  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.replace(`.${rootDomain}`, '');
    return sub && sub !== 'www' ? sub : null;
  }

  return null;
}
