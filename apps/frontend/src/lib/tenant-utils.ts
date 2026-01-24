/**
 * Best-effort tenant key resolver for the frontend (client-side).
 *
 * Priority:
 * 1) Path-based multi-tenant routing: /s/[subdomain]/...
 * 2) Host-based: tenant.domain.tld (also works for tenant.localhost)
 *
 * Falls back to "default".
 */
export function getTenantKeyFromLocation(): string {
  if (typeof window === 'undefined') return 'default';

  try {
    const { hostname, pathname } = window.location;

    // Path-based (our app router)
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 's' && parts[1]) {
      return decodeURIComponent(parts[1]);
    }

    // Host-based (tenant.domain.com or tenant.localhost)
    const hostParts = hostname.split('.').filter(Boolean);
    if (hostParts.length >= 2) {
      const candidate = hostParts[0];
      if (candidate && candidate !== 'www' && candidate !== 'localhost') {
        return candidate;
      }
    }
  } catch {
    // ignore
  }

  return 'default';
}
