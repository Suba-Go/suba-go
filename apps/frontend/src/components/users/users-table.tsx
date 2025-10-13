'use client';

import { useState } from 'react';
import { useUsers, User } from '@/hooks/use-users';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  RefreshCwIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldIcon
} from 'lucide-react';
import { UsersTableSkeleton } from './users-table-skeleton';
import { UsersSearchBar } from './users-search-bar';

interface UsersTableProps {
  className?: string;
}

export function UsersTable({ className }: UsersTableProps) {
  const { users, allUsers, loading, error, refetch, filterByEmail } = useUsers();
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'AUCTION_MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'AUCTION_MANAGER':
        return 'Gestor de Subastas';
      case 'USER':
        return 'Usuario';
      default:
        return role;
    }
  };

  const SortButton = ({ field, children }: { field: keyof User; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
        )}
      </span>
    </Button>
  );

  if (loading) {
    return <UsersTableSkeleton />;
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Usuarios de la Empresa</h2>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
        <div className="border rounded-lg">
          <div className="p-8 text-center text-red-500">
            <UserIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Error al cargar usuarios</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Usuarios de la Empresa</h2>
          <p className="text-sm text-gray-600">
            {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
            {users.length !== allUsers.length && (
              <span className="text-blue-600"> (de {allUsers.length} total)</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <UsersSearchBar 
        onSearch={filterByEmail}
        placeholder="Buscar por email..."
        className="max-w-md"
      />

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="name">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Nombre
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="public_name">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Nombre Público
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="email">
                  <MailIcon className="h-4 w-4 mr-1" />
                  Email
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="phone">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  Teléfono
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="rut">
                  RUT
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="role">
                  <ShieldIcon className="h-4 w-4 mr-1" />
                  Rol
                </SortButton>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="createdAt">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Fecha de Registro
                </SortButton>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  <UserIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">
                    {allUsers.length === 0 
                      ? "No hay usuarios registrados" 
                      : "No se encontraron usuarios"
                    }
                  </p>
                  <p className="text-sm">
                    {allUsers.length === 0 
                      ? "Los usuarios aparecerán aquí cuando se registren"
                      : "Intenta con otro término de búsqueda"
                    }
                  </p>
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap font-medium">
                    {user.name || 'Sin nombre'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {user.public_name || 'No especificado'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{user.phone || 'No especificado'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{user.rut || 'No especificado'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
