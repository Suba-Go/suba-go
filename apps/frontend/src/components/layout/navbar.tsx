'use client';

import { Button } from '@suba-go/shared-components/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6 bg-dark border-b border-gray-800">
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo-black.jpeg"
          alt="Suba&Go Logo"
          width={32}
          height={32}
        />
        <span className="text-xl font-bold text-soft-white">Suba&Go</span>
      </Link>

      <nav className="flex items-center space-x-6">
        <Link href="/que-hacemos">
          <Button
            variant="ghost"
            className="text-soft-white hover:text-primary hover:bg-dark/80"
          >
            Qué hacemos
          </Button>
        </Link>
        <Link href="/sobre-nosotros">
          <Button
            variant="ghost"
            className="text-soft-white hover:text-primary hover:bg-dark/80"
          >
            Sobre nosotros
          </Button>
        </Link>
        <Link href="/estadisticas">
          <Button
            variant="ghost"
            className="text-soft-white hover:text-primary hover:bg-dark/80"
          >
            Estadísticas
          </Button>
        </Link>
        <Link href="/login">
          <Button
            variant="outline"
            className="text-dark border-soft-white hover:border-primary border-2"
          >
            Iniciar Sesión
          </Button>
        </Link>
        {process.env.NODE_ENV === 'development' && (
          <Link href="/debug-session">
            <Button
              variant="ghost"
              className="text-soft-white hover:text-primary hover:bg-dark/80 text-xs"
            >
              Debug
            </Button>
          </Link>
        )}
      </nav>
    </header>
  );
}
