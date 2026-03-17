'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Gavel,
  Car,
  Users,
  Building2,
  FileBarChart,
  CreditCard,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@suba-go/shared-components/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/subastas', label: 'Subastas', icon: Gavel },
  { href: '/admin/adjudicados', label: 'Adjudicados', icon: Car },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/clientes', label: 'Clientes', icon: Building2 },
  { href: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { href: '/admin/cobros', label: 'Sistema de Cobro', icon: CreditCard },
  { href: '/admin/logs', label: 'Logs', icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return; // no guards on the login page itself
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
    }
  }, [status, session, router, pathname, isLoginPage]);

  // Login page renders without sidebar/guards
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-700 border-t-yellow-500" />
          <p className="text-sm text-stone-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-stone-800 bg-stone-950 transition-all duration-200 lg:relative',
          collapsed ? 'w-[68px]' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-stone-800 px-4">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">
              Suba<span className="text-yellow-500">&</span>Go
            </span>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 lg:block hidden"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="border-t border-stone-800 p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-500">
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session?.user?.name || 'Admin'}</p>
                <p className="truncate text-xs text-stone-500">{session?.user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-stone-800 px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
              Admin
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
