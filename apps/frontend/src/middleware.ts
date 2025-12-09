import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { getSubdomainFromHost } from '@suba-go/shared-components';
import { isUserProfileComplete } from './utils/subdomain-profile-validation';

// Determine ROOT_DOMAIN based on APP_ENV
const APP_ENV =
  process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';
const ROOT_DOMAIN =
  APP_ENV === 'local'
    ? 'localhost:3000'
    : APP_ENV === 'development'
    ? 'development.subago.cl'
    : process.env.ROOT_DOMAIN ?? 'subago.cl';

export default auth(async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  let domain = ROOT_DOMAIN;

  if (host.includes('development.subago.cl')) {
    domain = 'development.subago.cl';
  }

  const subdomain = getSubdomainFromHost(host, domain);
  const { pathname } = request.nextUrl;

  // Prevent direct access to internal /s/ routes
  if (pathname.startsWith('/s/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // rutas públicas (agrega estáticos si los sirves fuera del matcher)
  const publicPrefixes = ['/api', '/_next', '/favicon.ico', '/login', '/invite', '/company-invite'];

  if (subdomain) {
    // Clean URL rewrites - transform user-facing URLs to internal s/{subdomain} structure
    // This hides the internal routing structure from users

    // Root path
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }
    // Login page
    if (pathname === '/login') {
      const u = new URL(`/s/${subdomain}/login`, request.url);
      u.search = request.nextUrl.search;
      return NextResponse.rewrite(u);
    }

    // Profile page
    if (pathname === '/perfil') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/perfil`, request.url)
      );
    }

    //dashboard
    if (pathname === '/dashboard') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/dashboard`, request.url)
      );
    }

    // Products page
    if (pathname === '/items') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/items`, request.url)
      );
    }

    // Product detail page
    if (pathname.startsWith('/items/') && pathname.split('/').length === 3) {
      const itemId = pathname.split('/')[2];
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/items/${itemId}`, request.url)
      );
    }

    // Users page
    if (pathname === '/usuarios') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/usuarios`, request.url)
      );
    }

    // Invite user page
    if (pathname === '/users/invite') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/users/invite`, request.url)
      );
    }

    // Feedback page
    if (pathname === '/feedback') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/feedback`, request.url)
      );
    }

    // Company invite generation page
    if (pathname === '/companies/invite') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/companies/invite`, request.url)
      );
    }

    // Company settings page
    if (pathname === '/configuracion') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/configuracion`, request.url)
      );
    }

    // Auctions pages
    if (pathname === '/subastas') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/subastas`, request.url)
      );
    }
<<<<<<< HEAD
    // Stats page
    if (pathname === '/estadisticas') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/estadisticas`, request.url)
      );
    }
    
=======

>>>>>>> development
    // Onboarding page
    if (pathname === '/onboarding') {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/onboarding`, request.url)
      );
    }

    // Individual auction page
    if (pathname.startsWith('/subastas/') && pathname.split('/').length === 3) {
      const auctionId = pathname.split('/')[2];
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/subastas/${auctionId}`, request.url)
      );
    }

    // Check if this is a public route before doing authentication
    const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));

    // If it's not a public route and not already handled above,
    // it might be a dynamic route or future route - let it pass through
    // but still apply authentication logic
    const session = request.auth;

    if (!session && !isPublic) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate user belongs to the company (subdomain is company name)
    if (session && !isPublic) {
      const userCompanyName = session.user?.company?.name ?? '';

      if (userCompanyName !== subdomain) {
        // Redirect to login if user doesn't belong to this company
        const login = new URL('/login', request.url);
        return NextResponse.redirect(login);
      }

      // Check if user profile is complete - redirect to /onboarding if not
      if (!isUserProfileComplete(session)) {
        // redirect to public onboarding route
        return NextResponse.redirect(new URL(`/onboarding`, request.url));
      }
    }

    // bloquea zonas globales desde subdominios
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/register')
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)'],
};
