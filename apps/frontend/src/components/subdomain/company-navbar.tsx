'use client';

import { CompanyDto } from '@suba-go/shared-validation';
import { protocol, rootDomain } from '@suba-go/shared-components/lib/utils';

import { Button } from '@suba-go/shared-components/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { User, LogOut, ChevronDown, Gavel, Package, Users } from 'lucide-react';
import Link from 'next/link';

interface CompanyNavbarProps {
  company: CompanyDto;
  subdomain: string;
}

export default function CompanyNavbar({
  company,
  subdomain,
}: CompanyNavbarProps) {
  const primaryColor = company.principal_color || '#3B82F6';
  const { data: session, status } = useSession();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    await signOut({ redirect: false });
    // Redirect to company login after sign out
    handleLoginRedirect();
  };

  const handleLoginRedirect = () => {
    if (process.env.NODE_ENV === 'development') {
      // Development: redirect to localhost:3000/login
      window.location.href = 'http://localhost:3000/login';
    } else {
      // Production: redirect to main domain
      window.location.href = `${protocol}://${rootDomain}/login`;
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    window.location.href = `/s/${subdomain}/perfil`;
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Company Logo/Name */}
          <div className="flex items-center space-x-4">
            {company.logo && (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="h-8 w-8 object-contain"
              />
            )}
            <Link href={`/s/${subdomain}`}>
              <h1 
                className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity" 
                style={{ color: primaryColor }}
              >
                {company.name}
              </h1>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href={`/s/${subdomain}/subastas`}>
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Gavel className="h-4 w-4" />
                Subastas
              </Button>
            </Link>
            {/* Productos - Solo para AUCTION_MANAGER */}
            {session?.user?.role === 'AUCTION_MANAGER' && (
              <Link href={`/s/${subdomain}/productos`}>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Productos
                </Button>
              </Link>
            )}
            {/* Usuarios - Solo para AUCTION_MANAGER */}
            {session?.user?.role === 'AUCTION_MANAGER' && (
              <Link href={`/s/${subdomain}/usuarios`}>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Usuarios
                </Button>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* <CustomLink
              href={`${protocol}://${rootDomain}`}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Volver a Suba&Go
            </CustomLink> */}

            {/* Auth Section */}
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">Cargando...</div>
            ) : session ? (
              /* Profile Menu for Authenticated Users */
              <div className="relative profile-menu-container">
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
                      <hr className="border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Cerrar Sesión
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
          </div>
        </div>
      </div>

      {/* Mobile menu (hidden by default, can be toggled) */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          <Link href={`/s/${subdomain}/subastas`}>
            <Button
              variant="ghost"
              className="w-full text-left justify-start text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <Gavel className="h-4 w-4" />
              Subastas
            </Button>
          </Link>
          {/* Productos - Solo para AUCTION_MANAGER */}
          {session?.user?.role === 'AUCTION_MANAGER' && (
            <Link href={`/s/${subdomain}/productos`}>
              <Button
                variant="ghost"
                className="w-full text-left justify-start text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Productos
              </Button>
            </Link>
          )}
          {/* Usuarios - Solo para AUCTION_MANAGER */}
          {session?.user?.role === 'AUCTION_MANAGER' && (
            <Link href={`/s/${subdomain}/usuarios`}>
              <Button
                variant="ghost"
                className="w-full text-left justify-start text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Usuarios
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
