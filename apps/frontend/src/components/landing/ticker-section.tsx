'use client';

export default function TickerSection() {
  const items = [
    { text: 'Subastas en vivo', highlight: true },
    { text: 'Margen positivo', highlight: false },
    { text: 'Transparencia total', highlight: true },
    { text: 'Proceso ágil', highlight: false },
    { text: 'Mayor rentabilidad', highlight: true },
    { text: 'Tensión positiva', highlight: false },
  ];

  // Duplicate items for seamless scrolling
  const allItems = [...items, ...items];

  return (
    <div className="overflow-hidden whitespace-nowrap border-t border-b border-yellow/15 bg-dark py-3">
      <div className="inline-flex animate-ticker">
        {allItems.map((item, i) => (
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
  );
}
