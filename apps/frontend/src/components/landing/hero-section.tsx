'use client';

import { useDemoModal } from '@/contexts/demo-modal-context';
import { useLandingNav } from '@/contexts/landing-nav-context';

export default function HeroSection() {
  const { open: openDemoModal } = useDemoModal();
  const { navigateTo } = useLandingNav();
  return (
    <section className="relative min-h-[calc(100vh-7rem)] grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-center px-6 md:px-12 pt-24 pb-6 overflow-hidden">
      {/* Animated grid background */}
      <div className="hero-grid-bg absolute inset-0 z-0 animate-grid-scroll" />

      {/* Glow effect */}
      <div className="absolute z-0 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(236,194,24,0.07)_0%,transparent_65%)] -top-[200px] -left-[150px] animate-glow-pulse" />

      {/* Left content */}
      <div className="relative z-[2]">
        <div className="inline-flex items-center gap-2.5 font-mono text-[10px] tracking-[2px] text-yellow uppercase mb-9 border border-yellow/15 py-1.5 px-4">
          <span className="w-[7px] h-[7px] rounded-full bg-yellow animate-blink shadow-[0_0_8px_#ECC218]" />
          Sistema activo — Plataforma B2B de subastas
        </div>

        <h1 className="text-[clamp(56px,7.5vw,120px)] font-black leading-[0.87] tracking-[-3px] mb-9 relative animate-glitch whitespace-nowrap">
          <span className="block text-white">CONVIERTE</span>
          <span className="block text-white">SOBRESTOCK</span>
          <span className="block text-stroke-yellow">EN MARGEN</span>
        </h1>

        <p className="text-[17px] text-[#BBBBCC] leading-[1.75] max-w-[500px] mb-12 font-light tracking-[0.2px]">
          Subastas en vivo donde múltiples compradores compiten por tus productos, elevando el precio final de forma automática y transparente.
        </p>

        <div className="flex gap-5 items-center flex-wrap">
          <button
            onClick={openDemoModal}
            className="btn-shadow relative font-mono bg-yellow text-dark py-4 px-10 text-xs font-bold tracking-[2px] uppercase inline-block transition-all hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0_#ECC218] cursor-pointer"
          >
            Solicitar demo
          </button>
          <button
            onClick={() => navigateTo('proceso')}
            className="font-mono text-[11px] text-muted tracking-[2px] uppercase flex items-center gap-2 transition-colors hover:text-yellow cursor-pointer"
          >
            Ver cómo funciona →
          </button>
        </div>
      </div>

      {/* Right — Futuristic HUD panel */}
      <div className="relative z-[2] hidden lg:block">
        <div className="relative border border-yellow/15 bg-[#08080D] font-mono shadow-[0_0_80px_rgba(236,194,24,0.04)] overflow-hidden">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-yellow/50" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-yellow/50" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-yellow/50" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-yellow/50" />

          {/* Top glow line */}
          <div className="absolute -top-px left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-yellow/50 to-transparent" />

          {/* Scanlines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02] z-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236,194,24,0.2) 2px, rgba(236,194,24,0.2) 4px)',
            }}
          />

          {/* Header bar */}
          <div className="relative py-3 px-5 border-b border-yellow/10 flex items-center justify-between bg-yellow/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full bg-yellow animate-pulse shadow-[0_0_10px_#ECC218]" />
              <span className="text-[9px] text-yellow/60 tracking-[3px] uppercase">suba&amp;go // dashboard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-[7px] h-[7px] rounded-full bg-[#FF5F57]/80" />
              <div className="w-[7px] h-[7px] rounded-full bg-yellow/80" />
              <div className="w-[7px] h-[7px] rounded-full bg-[#29CA42]/80" />
            </div>
          </div>

          {/* Panel body */}
          <div className="relative z-[1] p-6 space-y-5">

            {/* Stat 1 — Margen */}
            <div className="group relative border border-yellow/10 bg-yellow/[0.02] p-5 transition-all hover:border-yellow/25 hover:bg-yellow/[0.04]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] text-yellow/60 tracking-[2px] uppercase mb-2 font-semibold">
                    Margen promedio sobre precio base
                  </div>
                  <div className="text-[52px] font-black text-yellow leading-none tracking-[-2px]" style={{ textShadow: '0 0 40px rgba(236,194,24,0.3)' }}>
                    +8<span className="text-[32px] ml-1">%</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 pb-2">
                  <div className="flex items-center gap-[3px]">
                    {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-yellow/40 rounded-full"
                        style={{ height: `${h * 0.35}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] text-yellow/30 tracking-[1px]">▲ TENDENCIA</span>
                </div>
              </div>
            </div>

            {/* Stat 2 — Velocidad */}
            <div className="group relative border border-yellow/10 bg-yellow/[0.02] p-5 transition-all hover:border-yellow/25 hover:bg-yellow/[0.04]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] text-yellow/60 tracking-[2px] uppercase mb-2 font-semibold">
                    Publica y subasta en
                  </div>
                  <div className="text-[52px] font-black text-yellow leading-none tracking-[-2px]" style={{ textShadow: '0 0 40px rgba(236,194,24,0.3)' }}>
                    10<span className="text-[24px] font-bold ml-1 tracking-normal"> min</span>
                  </div>
                </div>
                <div className="pb-2">
                  <div className="w-11 h-11 rounded-full border-2 border-yellow/25 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full border-2 border-yellow/50 border-t-yellow animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#8888A0] mt-2.5 leading-relaxed tracking-wide font-medium">
                Creas el auto, armas la subasta e invitas compradores.
              </p>
            </div>

            {/* Stat 3 — Red de compradores */}
            <div className="group relative border border-yellow/10 bg-yellow/[0.02] p-5 transition-all hover:border-yellow/25 hover:bg-yellow/[0.04]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] text-yellow/60 tracking-[2px] uppercase mb-2 font-semibold">
                    Red de compradores activos
                  </div>
                  <div className="text-[52px] font-black text-yellow leading-none tracking-[-2px]" style={{ textShadow: '0 0 40px rgba(236,194,24,0.3)' }}>
                    +50
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 pb-2">
                  {/* Dot grid representing network */}
                  <div className="grid grid-cols-6 gap-[5px]">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{
                          backgroundColor: i < 14 ? 'rgba(236,194,24,0.5)' : 'rgba(236,194,24,0.15)',
                          boxShadow: i < 14 ? '0 0 6px rgba(236,194,24,0.3)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] text-[#29CA42]/70 tracking-[1px]">▲ CRECIENDO</span>
                </div>
              </div>
              <p className="text-[11px] text-[#8888A0] mt-2.5 leading-relaxed tracking-wide font-medium">
                Automotoras compitiendo en tiempo real por tus vehículos.
              </p>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between pt-2 border-t border-yellow/10">
              <div className="flex items-center gap-2">
                <span className="w-[5px] h-[5px] rounded-full bg-[#29CA42] shadow-[0_0_8px_rgba(41,202,66,0.5)]" />
                <span className="text-[9px] text-[#29CA42]/80 tracking-[2px] uppercase">Sistema operativo</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-yellow/30 tracking-[1px]">LIVE</span>
                <span className="inline-block w-1.5 h-3 bg-yellow/60 animate-cursor-blink" />
              </div>
            </div>

          </div>

          {/* Bottom glow line */}
          <div className="absolute -bottom-px left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
