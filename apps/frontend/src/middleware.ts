import { rootDomain } from '@suba-go/shared-components/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0]; // Remove port if present

  // Local development environment (nombre.localhost:3000)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Extract subdomain from hostname like "nombre.localhost"
    if (hostname.includes('.localhost')) {
      const subdomain = hostname.split('.localhost')[0];
      // Exclude 'www' as it's not a tenant subdomain
      return subdomain !== 'www' ? subdomain : null;
    }

    return null;
  }

  // Production environment (subago.cl)
  const rootDomainFormatted = rootDomain.split(':')[0]; // Remove port if present

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Handle www.nombre.subago.cl format
  if (
    hostname.startsWith('www.') &&
    hostname.endsWith(`.${rootDomainFormatted}`)
  ) {
    const withoutWww = hostname.replace('www.', '');
    const subdomain = withoutWww.replace(`.${rootDomainFormatted}`, '');
    // If subdomain is empty, it means it's www.subago.cl (main domain)
    return subdomain || null;
  }

  // Handle nombre.subago.cl format (without www)
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    // Check if user is authenticated for subdomain access
    const session = request.auth;

    // Define public routes that don't require authentication
    const publicRoutes = ['/api', '/_next', '/favicon.ico', '/login'];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Handle company login page
    if (pathname === '/login') {
      // Rewrite /login to /s/[subdomain]/login and preserve query parameters
      const rewriteUrl = new URL(`/s/${subdomain}/login`, request.url);
      rewriteUrl.search = request.nextUrl.search; // Preserve query params like ?email=...
      return NextResponse.rewrite(rewriteUrl);
    }

    // If not authenticated and not a public route, redirect to company login
    if (!session && !isPublicRoute) {
      // Redirect to the company's login page
      const companyLoginUrl = new URL('/login', request.url);
      return NextResponse.redirect(companyLoginUrl);
    }

    // SECURITY: If user is authenticated, verify they belong to this tenant
    if (session && !isPublicRoute) {
      // Get tenant domain from user's tenant (stored as full URL)
      const userTenantDomain = session.user?.tenant?.domain;

      if (!userTenantDomain) {
        console.warn(
          `[SECURITY] User ${session.user?.email} has no tenant domain`
        );
        const protocol = request.url.includes('localhost') ? 'http' : 'https';
        const rootDomain = request.url.includes('localhost')
          ? 'localhost:3000'
          : 'subago.cl';
        const globalLoginUrl = new URL('/login', `${protocol}://${rootDomain}`);
        return NextResponse.redirect(globalLoginUrl);
      }

      // Extract subdomain from the full domain URL
      let extractedSubdomain = userTenantDomain;

      // If domain is a full URL, extract just the subdomain part
      if (userTenantDomain.includes('://')) {
        try {
          const url = new URL(userTenantDomain);
          const hostname = url.hostname;
          // Extract subdomain (everything before the first dot)
          extractedSubdomain = hostname.split('.')[0];
        } catch (error) {
          console.error('Error parsing domain URL:', error);
          // Fallback: try to extract subdomain manually
          extractedSubdomain = userTenantDomain
            .replace(/^https?:\/\//, '')
            .split('.')[0];
        }
      }
      // If the extracted subdomain doesn't match the current subdomain
      if (extractedSubdomain !== subdomain) {
        // Log security violation for monitoring
        console.warn(
          `[SECURITY] User ${session.user?.email} attempted to access ${subdomain} but belongs to ${extractedSubdomain}`
        );

        // Redirect to global login to force re-authentication
        const protocol = request.url.includes('localhost') ? 'http' : 'https';
        const rootDomain = request.url.includes('localhost')
          ? 'localhost:3000'
          : 'subago.cl';
        const globalLoginUrl = new URL('/login', `${protocol}://${rootDomain}`);
        return NextResponse.redirect(globalLoginUrl);
      }
    }

    // Block access to admin page from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Block access to global auth pages from subdomains, but allow company login
    if (pathname.startsWith('/auth') || pathname.startsWith('/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For the root path on a subdomain, rewrite to the subdomain page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }

    // For any other path on a subdomain, redirect to the subdomain root
    // This ensures that subdomain.domain.com/anything goes to subdomain.domain.com
    if (pathname !== '/' && !pathname.startsWith('/s/') && !isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // On the root domain, allow normal access
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)',
  ],
};
