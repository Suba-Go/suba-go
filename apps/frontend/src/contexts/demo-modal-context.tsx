'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface DemoModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DemoModalContext = createContext<DemoModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function DemoModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <DemoModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DemoModalContext.Provider>
  );
}

export function useDemoModal() {
  return useContext(DemoModalContext);
}
