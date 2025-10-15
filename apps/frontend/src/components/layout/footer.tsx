import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-dark border-t border-gray-800 py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo-white.png"
              alt="Suba&Go Logo"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold text-soft-white">Suba&Go</span>
          </div>

          <div className="text-soft-white text-sm">
            © 2025 Suba&Go. Todos los derechos reservados.
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-dark border border-gray-600"></div>
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <div className="w-4 h-4 rounded-full bg-soft-white"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
