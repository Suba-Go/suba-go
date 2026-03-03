'use client';

import { useLandingNav } from '@/contexts/landing-nav-context';

const services = [
  {
    num: '// 01',
    title: 'Efecto de Tensión Positivo',
    desc: 'Generamos competencia real entre compradores en tiempo real. Cada oferta empuja el precio hacia arriba, y gana quien ofrezca más.',
  },
  {
    num: '// 02',
    title: 'Transparencia Total',
    desc: 'Todas las ofertas son visibles y trazables, eliminando dudas y negociaciones opacas. Sin sorpresas, sin letra chica.',
  },
  {
    num: '// 03',
    title: 'Proceso Ágil',
    desc: 'En minutos, la venta se concreta. Crea el producto, lanza la subasta e invita a los compradores.',
    link: '#proceso',
  },
  {
    num: '// 04',
    title: 'Mayor Rentabilidad',
    desc: 'Compradores compitiendo por un mismo activo significa mejores márgenes, sin bajar tu precio mínimo.',
  },
];

export default function ServiciosSection() {
  const { navigateTo } = useLandingNav();
  return (
    <section id="servicios" className="bg-dark-DEFAULT py-16 md:py-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Header — centered */}
        <div className="text-center mb-12 md:mb-14">
          <div className="font-mono text-[10px] tracking-[3px] text-yellow uppercase flex items-center gap-2.5 justify-center mb-4 before:content-['//'] before:text-yellow/35">
            Redefinimos la forma de vender
          </div>
          <h2 className="font-black text-[clamp(36px,5vw,72px)] leading-[0.93] tracking-[-1px] mb-4 text-white">
            Vender mejor no es suerte,{' '}
            <em className="not-italic text-yellow">es una estrategia</em>
          </h2>
          <p className="text-base text-[#BBBBCC] leading-[1.75] font-light max-w-[560px] mx-auto">
            Transformamos cada subasta en una venta que maximiza tu margen.
          </p>
        </div>

        {/* Service grid — 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-yellow/15 border border-yellow/15">
          {services.map((svc) => (
            <div
              key={svc.num}
              className="bg-dark p-6 md:p-7 relative overflow-hidden transition-colors hover:bg-[#1a1a24] group"
            >
              <div className="font-mono text-[11px] text-yellow/60 tracking-[1px] mb-2 transition-colors group-hover:text-yellow">
                {svc.num}
              </div>
              <h3 className="font-black text-lg tracking-[1px] mb-2 text-white">
                {svc.title}
              </h3>
              <p className="text-[13px] text-[#BBBBCC] leading-[1.7] font-medium">
                {svc.desc}
              </p>
              {svc.link && (
                <button
                  onClick={() => navigateTo('proceso')}
                  className="inline-flex items-center gap-2 font-mono text-[10px] text-yellow tracking-[1px] uppercase mt-2.5 transition-all hover:gap-3.5 cursor-pointer"
                >
                  Ver proceso →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
