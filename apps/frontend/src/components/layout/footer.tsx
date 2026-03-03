import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-dark border-t border-yellow/15 py-7 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="font-black text-lg tracking-[5px] text-yellow">
          SUBA&amp;GO
        </div>
        <p className="font-mono text-[10px] text-muted tracking-[1px]">
          © 2025 Suba&amp;Go — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
