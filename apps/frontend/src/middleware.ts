import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getSubdomainFromHost } from '@suba-go/shared-components';
import { isUserProfileComplete } from './utils/subdomain-profile-validation';
import { normalizeCompanyName } from './utils/company-normalization';
import { isAllowedTenantPathForRole } from './utils/rbac';

// Determine ROOT_DOMAIN based on APP_ENV
const APP_ENV =
  process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';

const ROOT_DOMAIN =
  APP_ENV === 'local'
    ? 'localhost:3000'
    : APP_ENV === 'development'
      ? 'development.subago.cl'
      : process.env.ROOT_DOMAIN ?? 'subago.cl';

const AUTH_SECRET = process.env.AUTH_SECRET;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ bypass total de NextAuth endpoints
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') ?? '';
  let domain = ROOT_DOMAIN;

  if (host.includes('development.subago.cl')) {
    domain = 'development.subago.cl';
  }

  const subdomain = getSubdomainFromHost(host, domain);

  // Bloquear acceso directo a /s/*
  if (pathname.startsWith('/s/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rutas públicas (no requieren sesión)
  const publicPrefixes = [
    '/api',
    '/_next',
    '/uploads',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/login',
    '/invite',
    '/company-invite',
  ];

  if (subdomain) {
    // Rewrites principales
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }

    if (pathname === '/login') {
      const u = new URL(`/s/${subdomain}/login`, request.url);
      u.search = request.nextUrl.search;
      return NextResponse.rewrite(u);
    }

    // Mapeos tenant
    const directMap: Record<string, string> = {
      '/perfil': '/perfil',
      '/dashboard': '/dashboard',
      '/items': '/items',
      '/usuarios': '/usuarios',
      '/usuarios/invite': '/usuarios/invite',
      '/feedback': '/feedback',
      '/companies/invite': '/companies/invite',
      '/configuracion': '/configuracion',
      '/subastas': '/subastas',
      '/mis-subastas': '/mis-subastas',
      '/adjudicaciones': '/adjudicaciones',
      '/estadisticas': '/estadisticas',
      '/onboarding': '/onboarding',
      '/invite': '/invite',
    };

    if (directMap[pathname]) {
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}${directMap[pathname]}`, request.url)
      );
    }

    // Detail pages
    if (pathname.startsWith('/items/') && pathname.split('/').length === 3) {
      const itemId = pathname.split('/')[2];
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/items/${itemId}`, request.url)
      );
    }

    if (pathname.startsWith('/subastas/') && pathname.split('/').length === 3) {
      const auctionId = pathname.split('/')[2];
      return NextResponse.rewrite(
        new URL(`/s/${subdomain}/subastas/${auctionId}`, request.url)
      );
    }

    // Permitir públicas
    const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    // Validar sesión vía JWT (Edge-safe)
    if (!AUTH_SECRET) {
      // sin secret no se puede validar token en middleware
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const token = await getToken({ req: request, secret: AUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Tus callbacks meten user/tokens en el JWT
    const t: any = token;

    const userCompanyNameRaw = t?.user?.company?.name ?? '';
    const userCompanyName = normalizeCompanyName(userCompanyNameRaw);

    if (userCompanyName !== normalizeCompanyName(subdomain)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isUserProfileComplete({ user: t.user } as any)) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const userRole = t?.user?.role;
    if (!isAllowedTenantPathForRole(userRole as any, pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Bloquear zonas globales desde tenant
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/register')
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Cubre API (para que los route handlers protegidos puedan operar con normalidad)
    '/api/:path*',

    // Cubre páginas (excluye internals)
    '/((?!api|_next|uploads|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
