'use client';

import { type ReactNode } from 'react';
import { useLandingNav } from '@/contexts/landing-nav-context';
import HeroSection from './hero-section';
import TickerSection from './ticker-section';
import QueHacemosSection from './que-hacemos-section';
import ServiciosSection from './servicios-section';
import ProcesoSection from './proceso-section';
import NosotrosSection from './nosotros-section';
import CtaSection from './cta-section';
import Link from 'next/link';

interface Section {
  id: string;
  label: string;
  component: ReactNode;
}

const sections: Section[] = [
  { id: 'inicio', label: 'Inicio', component: <><HeroSection /><TickerSection /></> },
  { id: 'proceso', label: 'Proceso', component: <><TickerSection /><ProcesoSection /></> },
  { id: 'que-hacemos', label: 'Qué hacemos', component: <><TickerSection /><QueHacemosSection /><ServiciosSection /></> },
  { id: 'nosotros', label: 'Nosotros', component: <NosotrosSection /> },
  { id: 'cta', label: 'Demo', component: <CtaSection /> },
];

export default function LandingNavigator() {
  const { activeId, navigateTo } = useLandingNav();

  const activeSection = sections.find((s) => s.id === activeId);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="shrink-0 z-50 flex items-center justify-between px-6 md:px-10 py-3 border-b border-yellow/10 bg-dark/95 backdrop-blur-md">
        {/* Logo / Brand */}
        <span className="font-black text-lg tracking-[2px] text-yellow select-none">
          SUBA&amp;GO
        </span>

        {/* Right side: section links + login button */}
        <div className="flex items-center gap-4">
          {/* Section links (incluye Demo como antes) */}
          <div className="flex items-center gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id)}
                className={`
                  font-mono text-[11px] tracking-[2px] uppercase px-4 py-2
                  transition-all duration-200 cursor-pointer font-semibold
                  ${
                    activeId === s.id
                      ? 'text-yellow border-b-2 border-yellow'
                      : 'text-[#AAAABB] hover:text-white border-b-2 border-transparent'
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Botón "Iniciar sesión" (mismo estilo del botón amarillo) */}
          <Link
            href="/login"
            className="btn-shadow relative font-mono bg-yellow text-dark py-2 px-5 text-[11px] font-bold tracking-[2px] uppercase transition-all hover:bg-[#FFD740] hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* ── Active section ── */}
      <div className="flex-1 overflow-hidden">
        <div key={activeId} className="h-full overflow-y-auto animate-fade-in">
          {activeSection?.component}
        </div>
      </div>
    </div>
  );
}