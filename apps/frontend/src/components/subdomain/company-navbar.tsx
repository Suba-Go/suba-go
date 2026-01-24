'use client';

import { CompanyDto } from '@suba-go/shared-validation';
import { protocol, rootDomain } from '@suba-go/shared-components/lib/utils';
import { getNodeEnv } from '@suba-go/shared-components';

import { Button } from '@suba-go/shared-components/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
  Menu,
  Gavel,
  Package,
  Users,
  MessageSquare,
  UserPlus,
  Building2,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import {
  isUserProfileComplete,
  isUserAdminOrManager,
} from '@/utils/subdomain-profile-validation';
import { useCompany } from '@/hooks/use-company';
import MobileDrawer from '@/components/layout/mobile-drawer';
import { usePathname } from 'next/navigation';

interface CompanyNavbarProps {
  company: CompanyDto;
}

export default function CompanyNavbar({
  company: companyProp,
}: CompanyNavbarProps) {
  const { company: companyFromHook } = useCompany();
  // Use company from hook if available (more up-to-date), otherwise fallback to prop
  // The hook returns a Company type which has the same structure for the fields we need
  const company = companyFromHook
    ? {
        ...companyProp,
        name: companyFromHook.name,
        logo: companyFromHook.logo,
        principal_color: companyFromHook.principal_color,
      }
    : companyProp;
  const primaryColor = company.principal_color || '#3B82F6';
  const { data: session, status } = useSession();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-menu-container')) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut({ redirect: false });
    // Redirect to company login after sign out
    handleLoginRedirect();
  };

  const handleLoginRedirect = () => {
    const nodeEnv = getNodeEnv();

    if (nodeEnv === 'local') {
      // Local: redirect to localhost:3000/login
      window.location.href = 'http://localhost:3000/login';
    } else if (nodeEnv === 'development') {
      // Development: redirect to development.subago.cl/login
      window.location.href = 'https://development.subago.cl/login';
    } else {
      // Production: redirect to main domain
      window.location.href = `${protocol}://${rootDomain}/login`;
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.location.href = `/perfil`;
  };

  const handleConfigClick = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.location.href = `/configuracion`;
  };

  const canShowNav = isUserProfileComplete(session);

  const navItems = (() => {
    if (!canShowNav) return [];
    const items: Array<{
      href: string;
      label: string;
      icon: ReactNode;
      show: boolean;
      variant?: 'ghost' | 'default';
    }> = [];

    // Admin/Manager
    items.push({
      href: '/subastas',
      label: 'Subastas',
      icon: <Gavel className="h-4 w-4" />,
      show: isUserAdminOrManager(session),
      variant: 'ghost',
    });

    // User views
    items.push({
      href: '/mis-subastas',
      label: 'Mis subastas',
      icon: <Gavel className="h-4 w-4" />,
      show: session?.user?.role === 'USER',
      variant: 'ghost',
    });
    items.push({
      href: '/adjudicaciones',
      label: 'Mis adjudicaciones',
      icon: <Package className="h-4 w-4" />,
      show: session?.user?.role === 'USER',
      variant: 'ghost',
    });

    // Products
    items.push({
      href: '/items',
      label: 'Productos',
      icon: <Package className="h-4 w-4" />,
      show: isUserAdminOrManager(session),
      variant: 'ghost',
    });

    // Users
    items.push({
      href: '/usuarios',
      label: 'Usuarios',
      icon: <Users className="h-4 w-4" />,
      show: isUserAdminOrManager(session),
      variant: 'ghost',
    });

    // Stats
    items.push({
      href: '/estadisticas',
      label: 'Estadísticas',
      icon: <BarChart3 className="h-4 w-4" />,
      show: session?.user?.role === 'AUCTION_MANAGER',
      variant: 'ghost',
    });

    // Feedback
    items.push({
      href: '/feedback',
      label: 'Feedback',
      icon: <MessageSquare className="h-4 w-4" />,
      show: session?.user?.role === 'AUCTION_MANAGER',
      variant: 'ghost',
    });

    // Invite
    items.push({
      href: '/usuarios/invite',
      label: 'Invitar usuario',
      icon: <UserPlus className="h-4 w-4" />,
      show: session?.user?.role === 'AUCTION_MANAGER',
      variant: 'default',
    });

    return items.filter((i) => i.show);
  })();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Company Logo/Name */}
          <Link href={`/`}>
            <div className="flex items-center space-x-4">
              {company.logo && (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain hover:cursor-pointer"
                />
              )}
              <h1
                className="text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                {company.name}
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {canShowNav && (
            <nav className="hidden md:flex flex-wrap items-center gap-3">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={item.variant ?? 'ghost'}
                  size="sm"
                  className={
                    item.variant === 'default'
                      ? 'flex items-center gap-2 text-white'
                      : 'text-gray-600 hover:text-gray-900 flex items-center gap-2'
                  }
                  style={
                    item.variant === 'default'
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* <CustomLink
              href={`${protocol}://${rootDomain}`}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Volver a Suba&Go
            </CustomLink> */}

            {/* Auth Section */}
            {status === 'loading' ? (
              <div className="flex items-center space-x-4">
                <Spinner className="size-4" />
              </div>
            ) : session ? (
              /* Profile Menu for Authenticated Users */
              <div className="relative profile-menu-container hidden md:block">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isProfileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-navbar">
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Perfil
                      </button>
                      {isUserAdminOrManager(session) && (
                        <button
                          onClick={handleConfigClick}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Users className="w-4 h-4 mr-3" />
                          Configuración
                        </button>
                      )}
                      <hr className="border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login Button for Unauthenticated Users */
              <Button
                onClick={handleLoginRedirect}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Iniciar Sesión
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        title={company.name}
        side="right"
      >
        <div className="px-4 py-4">
          {/* User summary */}
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-700" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'Cuenta'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {session?.user?.email ?? ''}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="mt-4 space-y-1">
            {navItems.length > 0 ? (
              navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={item.variant ?? 'ghost'}
                  className={
                    item.variant === 'default'
                      ? 'w-full justify-start gap-2 text-white'
                      : 'w-full justify-start gap-2 text-gray-700'
                  }
                  style={
                    item.variant === 'default'
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              ))
            ) : (
              <div className="text-sm text-gray-500 px-1">
                Completa tu perfil para ver el menú.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 border-t pt-4 space-y-1">
            {session ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleProfileClick}
                >
                  <User className="h-4 w-4" />
                  Perfil
                </Button>
                {isUserAdminOrManager(session) && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={handleConfigClick}
                  >
                    <Building2 className="h-4 w-4" />
                    Configuración
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLoginRedirect();
                }}
                style={{ backgroundColor: primaryColor }}
              >
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </MobileDrawer>
    </header>
  );
}
