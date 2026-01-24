'use client';

import { Button } from '@suba-go/shared-components/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import MobileDrawer from './mobile-drawer';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const shouldShowNavbar = !pathname.includes('/login');

  if (!shouldShowNavbar) {
    return null;
  }
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 md:px-6 bg-dark/95 backdrop-blur border-b border-gray-800">
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo-white.png"
          alt="Suba&Go Logo"
          width={50}
          height={50}
        />
        <span className="text-xl font-bold text-soft-white">Suba&Go</span>
      </Link>

      <nav className="hidden md:flex items-center space-x-2">
        <Button asChild variant="ghost" className="text-soft-white hover:text-primary hover:bg-dark/80">
          <Link href="/que-hacemos">Qué hacemos</Link>
        </Button>
        <Button asChild variant="ghost" className="text-soft-white hover:text-primary hover:bg-dark/80">
          <Link href="/sobre-nosotros">Sobre nosotros</Link>
        </Button>
        <Button asChild variant="outline" className="text-white border-soft-white hover:border-primary border-2 bg-transparent">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </nav>

      {/* Mobile */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-soft-white" />
      </button>

      <MobileDrawer
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        title="Suba&Go"
        side="right"
      >
        <div className="px-4 py-4 space-y-1">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-gray-700"
          >
            <Link href="/que-hacemos" onClick={() => setIsMobileMenuOpen(false)}>
              Qué hacemos
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-gray-700"
          >
            <Link href="/sobre-nosotros" onClick={() => setIsMobileMenuOpen(false)}>
              Sobre nosotros
            </Link>
          </Button>
          <div className="pt-2">
            <Button
              asChild
              className="w-full"
            >
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                Iniciar Sesión
              </Link>
            </Button>
          </div>
        </div>
      </MobileDrawer>
    </header>
  );
}
