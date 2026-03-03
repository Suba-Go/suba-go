'use client';

const features = [
  {
    num: '01',
    icon: '⚡',
    title: 'Más Ágil',
    desc: 'Vende en minutos, no en semanas. Sin negociaciones interminables ni correos de ida y vuelta.',
  },
  {
    num: '02',
    icon: '⚖️',
    title: 'Más Justa',
    desc: 'Gana quien realmente valora más el producto. Sin favoritismos ni acuerdos bajo la mesa.',
  },
  {
    num: '03',
    icon: '👁️',
    title: 'Transparente',
    desc: 'Todas las ofertas son visibles en tiempo real. Misma información para compradores y vendedores.',
  },
  {
    num: '04',
    icon: '📈',
    title: 'Rentable',
    desc: 'Tu precio mínimo es solo el punto de partida. Cada nueva oferta lo empuja hacia arriba sola.',
  },
];

export default function QueHacemosSection() {
  return (
    <section id="que-hacemos" className="bg-dark py-20 md:py-28 px-6 md:px-12 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="font-mono text-[10px] tracking-[3px] text-yellow uppercase flex items-center gap-2.5 justify-center mb-4">
            ¿Qué produce Suba&amp;Go?
          </div>
          <h2 className="font-black text-[clamp(42px,5.5vw,80px)] leading-[0.93] tracking-[-1px] mb-4">
            Cuando hay competencia,
            <br />
            <em className="not-italic text-yellow">hay margen</em>
          </h2>
          <p className="text-base text-[#BBBBCC] leading-[1.75] font-light max-w-[560px] mx-auto">
            Reunimos a múltiples compradores interesados por un mismo activo y los hacemos competir en vivo y en directo. Esa competencia genera un efecto de tensión positivo que empuja el precio de venta hacia arriba.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-yellow/15 border border-yellow/15">
          {features.map((feat) => (
            <div
              key={feat.num}
              className="feat-card bg-dark p-8 md:p-10 relative overflow-hidden transition-colors hover:bg-[#1a1a24] group"
            >
              {/* Background number */}
              <span className="absolute top-2.5 right-4 font-black text-[80px] text-yellow/[0.12] leading-none transition-colors group-hover:text-yellow/[0.2]">
                {feat.num}
              </span>
              <span className="text-[28px] mb-5 block">{feat.icon}</span>
              <h3 className="font-black text-2xl tracking-[1px] mb-2.5 text-white">
                {feat.title}
              </h3>
              <p className="text-sm text-[#BBBBCC] leading-[1.75] font-medium">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
