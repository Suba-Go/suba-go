'use client';

import Image from 'next/image';
import { Linkedin } from 'lucide-react';

const tickerItems = [
  { text: 'Subastas en vivo', highlight: true },
  { text: 'Margen positivo', highlight: false },
  { text: 'Transparencia total', highlight: true },
  { text: 'Proceso ágil', highlight: false },
  { text: 'Mayor rentabilidad', highlight: true },
  { text: 'Tensión positiva', highlight: false },
];

export default function NosotrosSection() {
  return (
    <section id="nosotros" className="bg-dark-DEFAULT pt-20 md:pt-28 pb-0 px-6 md:px-12 overflow-hidden min-h-screen flex flex-col justify-center">
      <div className="max-w-[1100px] mx-auto">
        {/* Section title */}
        <div className="text-center mb-14 md:mb-18">
          <div className="font-mono text-[10px] tracking-[3px] text-yellow/60 uppercase flex items-center gap-2.5 justify-center mb-4">
            <span className="w-8 h-px bg-yellow/30" />
            El equipo
            <span className="w-8 h-px bg-yellow/30" />
          </div>
          <h2 className="font-black text-[clamp(40px,5.5vw,76px)] leading-[0.93] tracking-[-1px]">
            <span className="text-white">¿Quiénes </span>
            <span className="text-yellow" style={{ textShadow: '0 0 40px rgba(236,194,24,0.25)' }}>Somos</span>
            <span className="text-yellow/60">?</span>
          </h2>
        </div>

        {/* Two-column layout: mission + profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left — Profile card */}
          <div className="relative border border-yellow/20 bg-[#0A0A12] p-8 md:p-10 text-center overflow-hidden group transition-all hover:border-yellow/35">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow/40" />

            {/* Top glow */}
            <div className="absolute -top-px left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent" />

            <div className="relative">
              {/* Photo */}
              <div className="relative inline-block mb-5 z-[9001]">
                <Image
                  src="/uploads/nicodev/juan-aspillaga-new.jpg"
                  alt="Juan Aspillaga"
                  width={140}
                  height={140}
                  className="w-[140px] h-[140px] rounded-full object-cover object-top border-2 border-yellow/50"
                />
              </div>

              <h3 className="font-black text-[28px] tracking-[-0.5px] mb-1 text-white">
                Juan Aspillaga
              </h3>
              <div className="font-mono text-[10px] text-yellow tracking-[3px] uppercase mb-5">
                {'// Founder & CEO'}
              </div>
              <p className="text-[14px] text-[#BBBBCC] leading-[1.75] font-medium mb-6 max-w-[420px] mx-auto">
                Juan construyó su visión desde adentro de la industria automotriz. Pasó años en terreno — visitando concesionarios, flotas y operadores — entendiendo de primera mano cómo se compra y se vende. Esa experiencia lo llevó a crear Suba&amp;Go: una plataforma que moderniza la forma en que las empresas venden su stock.
              </p>

              {/* LinkedIn button */}
              <a
                href="https://www.linkedin.com/in/juan-ignacio-aspillaga-vergara-20265420b/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 font-mono text-[11px] text-yellow border border-yellow/30 py-2.5 px-5 tracking-[2px] uppercase transition-all hover:bg-yellow/10 hover:border-yellow"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            </div>
          </div>

          {/* Right — Mission card */}
          <div className="relative border border-yellow/20 bg-[#0A0A12] p-8 md:p-10 flex flex-col justify-center overflow-hidden group transition-all hover:border-yellow/35">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow/40" />

            {/* Top glow */}
            <div className="absolute -top-px left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent" />

            {/* Scanlines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236,194,24,0.15) 2px, rgba(236,194,24,0.15) 4px)',
              }}
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[2px] text-yellow/60 uppercase mb-5 border border-yellow/10 py-1 px-3">
                <span className="w-[5px] h-[5px] rounded-full bg-yellow/50" />
                Nosotros
              </div>

              <p className="text-[15px] text-[#CCCCDD] leading-[1.8] font-medium mb-5">
                Un joven emprendedor que desarrolló una plataforma transparente y económica, buscando recuperar lo que se ha perdido en el ecosistema automotriz: la confianza. Nuestra prioridad es hacer las cosas bien — y que tú confíes en nosotros.
              </p>

              <div className="w-full h-px bg-yellow/10 my-5" />

              <p className="text-[15px] text-[#CCCCDD] leading-[1.8] font-medium">
                La misión es construir una plataforma de subastas simple, confiable y escalable, diseñada para cualquier empresa que quiera vender mejor. Buscamos que cada cliente obtenga el mejor precio que el mercado puede ofrecer, de forma rápida, clara y sin fricciones.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Ticker at bottom of nosotros */}
      <div className="overflow-hidden whitespace-nowrap border-t border-b border-yellow/15 bg-dark mt-20 md:mt-28 py-3">
        <div className="inline-flex animate-ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="font-mono text-[11px] tracking-[3px] text-muted uppercase px-12 inline-flex items-center gap-12 after:content-['◆'] after:text-[6px] after:text-yellow/15"
            >
              <span className={item.highlight ? 'text-yellow' : ''}>
                {item.text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
