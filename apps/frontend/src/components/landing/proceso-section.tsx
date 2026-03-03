'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

const steps = [
  {
    num: '01',
    title: 'Crea tu producto y subasta',
    desc: 'Ingresa los detalles, define tu precio mínimo y configura la subasta en minutos desde tu panel.',
    images: ['/paso1-producto.png', '/paso1-subasta.png'],
  },
  {
    num: '02',
    title: 'Invita a los interesados',
    desc: 'Comparte el enlace con tus contactos o la red de Suba&Go. Se unen de inmediato y empieza el juego.',
    images: ['/paso2-invitar.png.png'],
  },
  {
    num: '03',
    title: 'Disfruta del juego',
    desc: 'Los compradores compiten en vivo y cada oferta sube el precio. Al finalizar, cobras al mejor precio del mercado.',
    images: ['/paso3-subasta.png'],
  },
];

/* ── Lightbox modal ── */
function ImageModal({
  images,
  onClose,
}: {
  images: string[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length);
      if (e.key === 'ArrowLeft')
        setCurrent((c) => (c - 1 + images.length) % images.length);
    },
    [images.length, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-yellow text-dark flex items-center justify-center font-bold text-lg hover:scale-110 transition-transform shadow-[0_0_20px_rgba(236,194,24,0.4)]"
        >
          ✕
        </button>

        {/* Image */}
        <div className="relative w-full max-h-[80vh] overflow-y-auto rounded-lg border border-yellow/30 shadow-[0_0_60px_rgba(236,194,24,0.12)]">
          <Image
            src={images[current]}
            alt={`Paso 1 - imagen ${current + 1}`}
            width={1200}
            height={2000}
            sizes="(max-width: 768px) 95vw, 700px"
            className="w-full h-auto object-contain bg-white rounded-lg"
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
            priority
          />
        </div>

        {/* Navigation dots & arrows */}
        {images.length > 1 && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() =>
                setCurrent((c) => (c - 1 + images.length) % images.length)
              }
              className="w-8 h-8 rounded-full border border-yellow/40 text-yellow flex items-center justify-center hover:bg-yellow/10 transition-colors text-sm"
            >
              ‹
            </button>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current
                    ? 'bg-yellow shadow-[0_0_8px_rgba(236,194,24,0.6)]'
                    : 'bg-yellow/30 hover:bg-yellow/50'
                }`}
              />
            ))}
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="w-8 h-8 rounded-full border border-yellow/40 text-yellow flex items-center justify-center hover:bg-yellow/10 transition-colors text-sm"
            >
              ›
            </button>
          </div>
        )}

        {/* Counter */}
        <p className="font-mono text-[11px] text-yellow/60 mt-2 tracking-[2px]">
          {current + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}

export default function ProcesoSection() {
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);

  return (
    <>
      {lightboxImages && (
        <ImageModal
          images={lightboxImages}
          onClose={() => setLightboxImages(null)}
        />
      )}
    <section id="proceso" className="bg-dark py-20 md:py-28 px-6 md:px-12 overflow-hidden min-h-screen flex flex-col justify-center">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="font-mono text-[10px] tracking-[3px] text-yellow uppercase flex items-center gap-2.5 justify-center mb-4">
            Proceso
          </div>
          <h2 className="font-black text-[clamp(42px,5.5vw,80px)] leading-[0.93] tracking-[-1px] mb-4 text-white">
            Tan simple como <em className="not-italic text-yellow">tres pasos</em>
          </h2>
          <p className="font-mono text-[12px] text-[#BBBBCC] tracking-[2px] mt-2.5 font-semibold">
            {'// El proceso completo tarda menos de 10 minutos en ejecutarse'}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 max-w-[960px] mx-auto mb-10 relative">
          {/* Connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-[27px] left-[calc(50%/3+28px)] right-[calc(50%/3+28px)] h-px bg-gradient-to-r from-yellow via-yellow/20 to-yellow" />

          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col items-center text-center px-4 relative z-[1] mb-8 md:mb-0"
            >
              {/* Step ring */}
              <div className="w-14 h-14 border-2 border-yellow bg-dark rounded-full flex items-center justify-center font-mono text-[13px] text-yellow tracking-[2px] shadow-[0_0_20px_rgba(236,194,24,0.12),inset_0_0_10px_rgba(236,194,24,0.04)]">
                {step.num}
              </div>

              {/* Step line */}
              <div className="w-px h-7 bg-gradient-to-b from-yellow to-transparent" />

              {/* Step card — futuristic */}
              <div className="relative border border-yellow/20 bg-[#0A0A12] p-5 md:p-6 w-full min-h-[220px] max-w-[280px] mx-auto flex flex-col justify-start transition-all duration-300 hover:border-yellow/50 hover:shadow-[0_0_40px_rgba(236,194,24,0.1)] group overflow-hidden">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow/40 transition-colors group-hover:border-yellow" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow/40 transition-colors group-hover:border-yellow" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow/40 transition-colors group-hover:border-yellow" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow/40 transition-colors group-hover:border-yellow" />

                {/* Top glow line */}
                <div className="absolute -top-px left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Scanlines */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.015]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236,194,24,0.15) 2px, rgba(236,194,24,0.15) 4px)',
                  }}
                />

                <h3 className="relative font-black text-lg tracking-[1px] mb-2.5 text-yellow">
                  {step.title}
                </h3>
                <p className="relative text-[13px] text-[#BBBBCC] leading-[1.75] font-semibold">
                  {step.desc}
                </p>

                {/* "Aprieta para ver" button — only for steps with images */}
                {step.images && (
                  <button
                    onClick={() => setLightboxImages(step.images!)}
                    className="relative mt-4 mx-auto inline-flex items-center gap-2 px-4 py-2 border border-yellow/40 text-yellow font-mono text-[11px] tracking-[2px] uppercase hover:bg-yellow/10 hover:border-yellow transition-all duration-300 group/btn"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Aprieta para ver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Equation bar — futuristic */}
        <div className="max-w-[960px] mx-auto relative overflow-hidden">
          <div className="relative flex items-center justify-center gap-5 py-7 px-10 border border-yellow/20 bg-[#0A0A12]">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-yellow/50" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-yellow/50" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-yellow/50" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-yellow/50" />

            {/* Glow lines */}
            <div className="absolute -top-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-yellow/50 to-transparent" />
            <div className="absolute -bottom-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-yellow/30 to-transparent" />

            {/* Left accent bar */}
            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-gradient-to-b from-yellow/60 via-yellow to-yellow/60 shadow-[0_0_12px_rgba(236,194,24,0.4)]" />

            {/* Scanlines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(236,194,24,0.15) 2px, rgba(236,194,24,0.15) 4px)',
              }}
            />

            {/* BG glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(236,194,24,0.06)_0%,transparent_70%)]" />

            <span className="relative font-mono text-[20px] md:text-[28px] text-yellow drop-shadow-[0_0_16px_rgba(236,194,24,0.5)]">
              {'//'}
            </span>
            <span className="relative font-black text-[22px] md:text-[32px] tracking-[2px] md:tracking-[3px] text-white">
              PROCESO
            </span>
            <span className="relative font-mono text-[20px] md:text-[28px] text-yellow drop-shadow-[0_0_16px_rgba(236,194,24,0.5)]">
              {'='}
            </span>
            <span className="relative font-black text-[22px] md:text-[32px] tracking-[2px] md:tracking-[3px] text-white">
              MÁRGENES
            </span>
            <span className="relative font-mono text-[20px] md:text-[28px] text-yellow drop-shadow-[0_0_16px_rgba(236,194,24,0.5)]">
              {'//'}
            </span>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
