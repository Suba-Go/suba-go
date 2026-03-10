'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useDemoModal } from '@/contexts/demo-modal-context';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { open: openDemoModal } = useDemoModal();

  // Close mobile drawer on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const shouldShowNavbar =
  !pathname.includes('/login') && !pathname.includes('/register');

  if (!shouldShowNavbar) {
    return null;
  }

  return (
    <header className="fixed top-0 z-50 w-full flex h-16 items-center justify-between px-6 md:px-12 bg-dark/90 backdrop-blur-xl border-b border-yellow/15">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex items-center group cursor-pointer relative"
      >
        {/* Corner brackets */}
        <div className="absolute -top-[2px] -left-[6px] w-3 h-3 border-t-2 border-l-2 border-yellow/50 group-hover:border-yellow transition-colors" />
        <div className="absolute -bottom-[2px] -right-[6px] w-3 h-3 border-b-2 border-r-2 border-yellow/50 group-hover:border-yellow transition-colors" />
        <div className="text-lg md:text-[22px] font-black tracking-[6px] text-yellow drop-shadow-[0_0_24px_rgba(236,194,24,0.35)] group-hover:drop-shadow-[0_0_32px_rgba(236,194,24,0.5)] transition-all px-1">
          SUBA<span className="text-white/90">&amp;</span>GO
        </div>
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-9">
        <Link
          href="/#que-hacemos"
          className="font-mono text-[11px] tracking-[2px] text-muted hover:text-yellow transition-colors uppercase"
        >
          Qué hacemos
        </Link>
        <Link
          href="/#servicios"
          className="font-mono text-[11px] tracking-[2px] text-muted hover:text-yellow transition-colors uppercase"
        >
          Servicios
        </Link>
        <Link
          href="/#proceso"
          className="font-mono text-[11px] tracking-[2px] text-muted hover:text-yellow transition-colors uppercase"
        >
          Proceso
        </Link>
        <Link
          href="/#nosotros"
          className="font-mono text-[11px] tracking-[2px] text-muted hover:text-yellow transition-colors uppercase"
        >
          Nosotros
        </Link>
        <button
          onClick={openDemoModal}
          className="btn-shadow relative font-mono bg-yellow text-dark py-2 px-5 text-[11px] font-bold tracking-[2px] uppercase transition-all hover:bg-[#FFD740] hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
        >
          Demo
        </button>

        <Link
          href="/login"
          className="btn-shadow relative font-mono bg-yellow text-dark py-2 px-5 text-[11px] font-bold tracking-[2px] uppercase transition-all hover:bg-[#FFD740] hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded hover:bg-yellow/10 active:bg-yellow/20 transition-colors"
        aria-label="Abrir menú"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-yellow" />
        ) : (
          <Menu className="h-5 w-5 text-yellow" />
        )}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 right-0 left-0 bg-dark-secondary border-b border-yellow/20 md:hidden p-4 space-y-2">
          <Link
            href="/#que-hacemos"
            className="block p-3 text-sm font-mono tracking-widest text-gray-400 hover:text-yellow hover:bg-yellow/10 rounded transition-colors uppercase"
          >
            Qué hacemos
          </Link>
          <Link
            href="/#servicios"
            className="block p-3 text-sm font-mono tracking-widest text-gray-400 hover:text-yellow hover:bg-yellow/10 rounded transition-colors uppercase"
          >
            Servicios
          </Link>
          <Link
            href="/#proceso"
            className="block p-3 text-sm font-mono tracking-widest text-gray-400 hover:text-yellow hover:bg-yellow/10 rounded transition-colors uppercase"
          >
            Proceso
          </Link>
          <Link
            href="/#nosotros"
            className="block p-3 text-sm font-mono tracking-widest text-gray-400 hover:text-yellow hover:bg-yellow/10 rounded transition-colors uppercase"
          >
            Nosotros
          </Link>
          <button
            onClick={() => { openDemoModal(); setIsMobileMenuOpen(false); }}
            className="block w-full bg-yellow text-dark px-4 py-3 rounded text-sm font-black tracking-widest uppercase hover:bg-yellow/90 transition-all text-center cursor-pointer"
          >
            Demo
          </button>
        </div>
      )}
    </header>
  );
}
