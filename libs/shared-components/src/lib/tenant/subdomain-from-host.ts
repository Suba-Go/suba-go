export function getSubdomainFromHost(
  host: string,
  rootDomain: string
): string | null {
  const hostname = host.split(':')[0]; // sin puerto

  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;

  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub && sub !== 'www' ? sub : null;
  }

  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const sub = hostname.split('---')[0];
    return sub || null;
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.replace(`.${rootDomain}`, '');
    return sub && sub !== 'www' ? sub : null;
  }

  return null;
}
