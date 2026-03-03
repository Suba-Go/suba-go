'use client';

import { useDemoModal } from '@/contexts/demo-modal-context';
import { X, Phone, Mail, Linkedin } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function DemoModal() {
  const { isOpen, close } = useDemoModal();
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={close}
    >
      {/* Backdrop with grid pattern */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(236,194,24,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(236,194,24,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[420px] bg-[#08080D] border border-yellow/20 shadow-[0_0_120px_rgba(236,194,24,0.06),_0_0_40px_rgba(236,194,24,0.04)] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow accent */}
        <div className="absolute -top-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-yellow/60 to-transparent" />

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-yellow/40" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-yellow/40" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-yellow/40" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-yellow/40" />

        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015] z-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236,194,24,0.15) 2px, rgba(236,194,24,0.15) 4px)',
          }}
        />

        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center border border-yellow/15 text-muted hover:text-yellow hover:border-yellow/40 hover:bg-yellow/5 transition-all duration-200"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-[1] p-8 pt-10">
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[2px] text-yellow/70 uppercase mb-6 border border-yellow/10 py-1 px-3">
            <span className="w-[6px] h-[6px] rounded-full bg-yellow animate-pulse shadow-[0_0_8px_#ECC218]" />
            Demo disponible
          </div>

          {/* Title */}
          <h3 className="font-black text-[30px] md:text-[34px] text-white leading-[1.05] tracking-[-1.5px] mb-2">
            ¿Tienes
            <br />
            <span className="text-yellow">sobrestock</span>?
          </h3>

          {/* Subtitle / description */}
          <div className="space-y-4 mt-7 mb-9 pl-4 border-l-2 border-yellow/20">
            <p className="text-[14px] text-yellow font-semibold leading-relaxed tracking-wide">
              Pruébalo sin pagar un peso — $0.
            </p>
            <p className="text-[14px] text-[#9999AA] leading-[1.7] font-light">
              Nosotros traemos la demanda, tú observas cómo compiten.
            </p>
            <p className="text-[14px] text-[#9999AA] leading-[1.7] font-light">
              El margen se comprueba solo.
            </p>
          </div>

          {/* Divider with label */}
          <div className="relative w-full h-px bg-yellow/10 mb-7">
            <span className="absolute -top-[9px] left-0 bg-[#08080D] pr-3 font-mono text-[9px] text-yellow/40 tracking-[2px] uppercase">
              Contacto
            </span>
          </div>

          {/* Contact info */}
          <div className="space-y-1">
            <p className="font-black text-white text-[15px] tracking-[1px] uppercase mb-3">
              Juan Aspillaga
            </p>

            <a
              href="tel:+56966567696"
              className="flex items-center gap-3 py-2.5 px-3 -mx-3 font-mono text-[12px] text-[#BBBBCC] hover:text-yellow hover:bg-yellow/[0.04] transition-all duration-200 tracking-[0.5px] group"
            >
              <Phone className="w-3.5 h-3.5 text-yellow/40 group-hover:text-yellow transition-colors" />
              +569 6656 7696
            </a>

            <a
              href="mailto:Juan@subago.cl"
              className="flex items-center gap-3 py-2.5 px-3 -mx-3 font-mono text-[12px] text-[#BBBBCC] hover:text-yellow hover:bg-yellow/[0.04] transition-all duration-200 tracking-[0.5px] group"
            >
              <Mail className="w-3.5 h-3.5 text-yellow/40 group-hover:text-yellow transition-colors" />
              Juan@subago.cl
            </a>

            <a
              href="https://www.linkedin.com/in/juan-ignacio-aspillaga-vergara-20265420b/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2.5 px-3 -mx-3 font-mono text-[12px] text-[#BBBBCC] hover:text-yellow hover:bg-yellow/[0.04] transition-all duration-200 tracking-[0.5px] group"
            >
              <Linkedin className="w-3.5 h-3.5 text-yellow/40 group-hover:text-yellow transition-colors" />
              LinkedIn
            </a>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/56966567696?text=${encodeURIComponent('Hola, me interesa saber más sobre Suba&Go')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full mt-6 py-3.5 bg-yellow hover:bg-yellow/90 transition-all duration-200 group"
          >
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="#0D0D12" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.795 6.655L2.667 29.333l7.026-1.84A13.28 13.28 0 0 0 16.004 29.2 13.26 13.26 0 0 0 29.333 15.89 13.26 13.26 0 0 0 16.004 2.667Zm0 24.24a10.96 10.96 0 0 1-5.587-1.53l-.4-.238-4.165 1.092 1.112-4.06-.262-.416a10.87 10.87 0 0 1-1.676-5.866A10.97 10.97 0 0 1 16.004 4.96 10.97 10.97 0 0 1 26.96 15.89a10.97 10.97 0 0 1-10.956 10.917Zm6.013-8.2c-.33-.165-1.952-.963-2.254-1.073-.303-.11-.523-.165-.743.165-.22.33-.854 1.073-1.046 1.294-.193.22-.385.248-.715.083-.33-.165-1.393-.514-2.654-1.638-.98-.874-1.643-1.953-1.835-2.283-.193-.33-.021-.508.145-.673.149-.148.33-.385.495-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.165-.743-1.79-1.018-2.45-.268-.644-.54-.557-.743-.567-.193-.01-.413-.012-.633-.012-.22 0-.578.083-.88.413-.303.33-1.156 1.13-1.156 2.755 0 1.625 1.183 3.195 1.349 3.415.165.22 2.33 3.555 5.644 4.984.789.34 1.404.543 1.884.695.792.252 1.512.216 2.082.131.635-.095 1.953-.798 2.228-1.568.276-.77.276-1.43.193-1.568-.083-.138-.303-.22-.633-.385Z"/>
            </svg>
            <span className="font-mono text-[12px] font-bold text-[#0D0D12] tracking-[2px] uppercase">
              Contáctanos directamente
            </span>
          </a>
        </div>

        {/* Bottom glow accent */}
        <div className="absolute -bottom-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent" />
      </div>
    </div>
  );
}
