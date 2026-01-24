export type UserRole = 'ADMIN' | 'AUCTION_MANAGER' | 'USER';

const isIdSegment = (s: string) => Boolean(s) && s !== 'new';

/**
 * Centralized RBAC for tenant (subdomain) **clean** routes.
 *
 * IMPORTANT:
 * - These `pathname` values are the public paths (e.g. `/subastas`),
 *   not the internal `/s/[subdomain]/...` paths.
 * - Middleware enforces these rules before rewriting.
 */
export function isAllowedTenantPathForRole(
  role: UserRole | undefined | null,
  pathname: string
): boolean {
  if (!role) return false;

  // Always-allowed authenticated routes
  if (
    pathname === '/' ||
    pathname === '/perfil' ||
    pathname === '/onboarding'
  ) {
    return true;
  }

  // USER-only routes
  if (pathname === '/mis-subastas' || pathname === '/adjudicaciones') {
    return role === 'USER';
  }

  // Detail routes that USER can access (read-only pages)
  // /subastas/:id
  if (pathname.startsWith('/subastas/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'subastas' && isIdSegment(parts[1])) {
      return true; // any authenticated role can view detail
    }
  }
  // /items/:id
  if (pathname.startsWith('/items/')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'items' && isIdSegment(parts[1])) {
      return true; // any authenticated role can view detail
    }
  }

  // Manager/Admin routes
  const isManagerOrAdmin = role === 'AUCTION_MANAGER' || role === 'ADMIN';

  // Auctions management list
  if (pathname === '/subastas') return isManagerOrAdmin;

  // Inventory management
  if (pathname === '/items') return isManagerOrAdmin;

  // User management
  if (pathname === '/usuarios' || pathname === '/usuarios/invite') {
    return isManagerOrAdmin;
  }

  // Company settings
  if (pathname === '/configuracion') return isManagerOrAdmin;

  // Stats dashboard
  if (pathname === '/estadisticas') return isManagerOrAdmin;

  // Feedback (client asked: AUCTION_MANAGER only; allow ADMIN too for internal oversight)
  if (pathname === '/feedback') {
    return role === 'AUCTION_MANAGER' || role === 'ADMIN';
  }

  // Company invite generation pages (if enabled)
  if (pathname.startsWith('/companies')) {
    return isManagerOrAdmin;
  }

  // Default: allow authenticated roles to reach unknown future routes,
  // but you can tighten this later by returning `false` here.
  return true;
}
