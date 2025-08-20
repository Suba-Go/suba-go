import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Qué hacemos | Suba&Go',
  description:
    'Descubre cómo Suba&Go transforma las ventas a través de subastas en vivo, creando un efecto de tensión positivo que eleva tu precio de venta.',
};

export default function QueHacemosPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              ¿Qué servicios ofrece Suba&Go?
            </h1>
            <p className="text-xl leading-relaxed">
              Subastar en vivo frente a múltiples interesados produce un{' '}
              <span className="font-semibold text-yellow-300">
                efecto de tensión positivo
              </span>{' '}
              que eleva tu precio de venta.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Value Proposition */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <h2 className="text-3xl font-bold text-dark mb-6 text-center">
                Transformamos cada subasta en una venta más justa, ágil,
                transparente y rentable
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed text-center">
                Tu precio mínimo se convierte en un punto de partida atractivo,
                que gana fuerza con cada nueva oferta. Así transformamos cada
                subasta en una experiencia que maximiza el valor de lo que
                vendes.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Efecto de Tensión Positivo
                </h3>
                <p className="text-gray-700">
                  Las subastas en vivo crean competencia real entre compradores,
                  elevando naturalmente el precio final.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Transparencia Total
                </h3>
                <p className="text-gray-700">
                  Proceso completamente transparente donde todos los
                  participantes pueden ver las ofertas en tiempo real.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Proceso Ágil
                </h3>
                <p className="text-gray-700">
                  Ventas rápidas y eficientes que reducen el tiempo entre la
                  decisión de vender y el cierre de la transacción.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Mayor Rentabilidad
                </h3>
                <p className="text-gray-700">
                  La competencia entre compradores genera mejores márgenes y
                  precios más justos para los vendedores.
                </p>
              </div>
            </div>

            {/* Platform Description */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-dark mb-4">
                La forma más simple y rentable de vender
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Una plataforma de subastas donde la confianza no es magia, es
                margen.
              </p>
              <Link
                href="/#formulario"
                className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <span>Suba&Go</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
