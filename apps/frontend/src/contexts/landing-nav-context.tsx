'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface LandingNavContextType {
  activeId: string;
  navigateTo: (id: string) => void;
}

const LandingNavContext = createContext<LandingNavContextType>({
  activeId: 'inicio',
  navigateTo: () => {},
});

export function useLandingNav() {
  return useContext(LandingNavContext);
}

export function LandingNavProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState('inicio');

  return (
    <LandingNavContext.Provider value={{ activeId, navigateTo: setActiveId }}>
      {children}
    </LandingNavContext.Provider>
  );
}
