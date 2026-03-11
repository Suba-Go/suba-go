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
  const { activeId } = useLandingNav();
  const activeSection = sections.find((s) => s.id === activeId);

  return (
    // Navbar is fixed (h-16), dejamos espacio arriba
    <div className="h-[calc(100vh-4rem)] mt-16 overflow-hidden">
      <div
          key={activeId}
          className={`h-full animate-fade-in ${
            activeId === 'inicio' ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {activeSection?.component}
      </div>
    </div>
  );
}