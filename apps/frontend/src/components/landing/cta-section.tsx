'use client';

import { useDemoModal } from '@/contexts/demo-modal-context';

export default function CtaSection() {
  const { open: openDemoModal } = useDemoModal();
  return (
    <section
      id="cta"
      className="cta-stripes cta-watermark bg-yellow py-20 md:py-28 px-6 md:px-12 text-center relative overflow-hidden"
    >
      <h2 className="font-black text-[clamp(54px,8.5vw,116px)] text-dark leading-[0.88] tracking-[-2px] mb-5 relative z-[1]">
        EMPIEZA HOY.
        <br />
        VENDE MEJOR.
      </h2>
      <p className="text-[17px] text-black/50 mb-12 font-light relative z-[1]">
        Te mostramos cómo Suba&amp;Go puede mejorar tus resultados — sin compromisos.
      </p>
      <button
        onClick={openDemoModal}
        className="inline-block font-mono bg-dark text-yellow py-4 px-12 md:px-14 text-xs font-bold tracking-[3px] uppercase relative z-[1] border-2 border-dark transition-all hover:bg-transparent hover:text-dark hover:translate-y-[-3px] hover:shadow-[0_10px_32px_rgba(0,0,0,0.2)] cursor-pointer"
      >
        Solicitar demo →
      </button>
    </section>
  );
}
