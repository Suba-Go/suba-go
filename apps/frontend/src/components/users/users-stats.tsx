'use client';

import { useUsers } from '@/hooks/use-users';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { UsersIcon, ShieldIcon, UserCheckIcon, ClockIcon } from 'lucide-react';

export function UsersStats() {
  const { users, loading } = useUsers();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === 'ADMIN').length;
  const managerUsers = users.filter(
    (user) => user.role === 'AUCTION_MANAGER'
  ).length;

  const recentUsers = users.filter((user) => {
    const userDate = new Date(user.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate > weekAgo;
  }).length;

  const stats = [
    {
      title: 'Total de Usuarios',
      value: totalUsers,
      description: 'Usuarios registrados',
      icon: UsersIcon,
      color: 'text-blue-600',
    },
    {
      title: 'Administradores',
      value: adminUsers,
      description: 'Usuarios con rol admin',
      icon: ShieldIcon,
      color: 'text-red-600',
    },
    {
      title: 'Gestores',
      value: managerUsers,
      description: 'Gestores de subastas',
      icon: UserCheckIcon,
      color: 'text-green-600',
    },
    {
      title: 'Nuevos esta semana',
      value: recentUsers,
      description: 'Registros recientes',
      icon: ClockIcon,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
