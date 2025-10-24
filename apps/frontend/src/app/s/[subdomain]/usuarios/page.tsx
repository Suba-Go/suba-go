import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/users/users-table';
import { UsersStats } from '@/components/users/users-stats';

export default async function UsuariosPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const session = await auth();

  // Verify user has AUCTION_MANAGER role or ADMIN role
  if (session.user.role !== 'AUCTION_MANAGER' && session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-2">
            Administra los usuarios de tu empresa
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <UsersStats />
        <UsersTable />
      </div>
    </div>
  );
}
