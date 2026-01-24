import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UserHomePage from '@/components/subdomain/user-home-page';

/**
 * IMPORTANT:
 * - This file lives under /s/[subdomain] which is an **internal** route.
 * - User-facing routes (no /s prefix) are handled by middleware rewrites.
 * - Therefore, any redirects MUST go to the **public path** (e.g. /estadisticas),
 *   not to /s/${subdomain}/estadisticas, otherwise middleware will bounce back to '/'
 *   and the UI may get stuck loading.
 */
export default async function SubdomainHomePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  // Await the params to satisfy the Next.js 15+ requirement
  await params;

  const session = await auth();

  // If unauthenticated, go to public login (middleware will rewrite it to /s/[subdomain]/login)
  if (!session) {
    redirect('/login');
  }

  const role = session.user?.role;

  // Manager/Admin home -> Estadísticas
  if (role === 'AUCTION_MANAGER' || role === 'ADMIN') {
    redirect('/estadisticas');
  }

  // USER home -> the "Mis Adjudicaciones + Subastas Activas y Próximas" view
  return <UserHomePage />;
}
