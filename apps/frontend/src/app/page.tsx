import MultiStepForm from '@/components/forms/multi-step-form';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suba&Go - Subastas B2B',
  description:
    'Plataforma de subastas donde la confianza no es magia, es margen. Subastar en vivo produce un efecto de tensión positivo que eleva tu precio de venta.',
};

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6">Suba&Go</h1>
            <p className="text-2xl mb-8 leading-relaxed">
              La forma más simple y rentable de vender
            </p>
            <p className="text-xl mb-8 opacity-90">
              Una plataforma de subastas donde la confianza no es magia, es
              margen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/que-hacemos"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Descubre cómo funciona
              </Link>
              <Link
                href="/estadisticas"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                Ver resultados reales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-dark mb-6">
              ¿Qué produce Suba&Go?
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Subastar en vivo frente a múltiples interesados produce un{' '}
              <span className="font-semibold text-primary">
                efecto de tensión positivo
              </span>{' '}
              que eleva tu precio de venta. Tu precio mínimo se convierte en un
              punto de partida atractivo, que gana fuerza con cada nueva oferta.
            </p>

            <div className="grid md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="font-semibold text-dark mb-2">Más Justa</h3>
                <p className="text-gray-600 text-sm">
                  Precios determinados por el mercado real
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="font-semibold text-dark mb-2">Más Ágil</h3>
                <p className="text-gray-600 text-sm">
                  Proceso rápido y eficiente
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="font-semibold text-dark mb-2">Transparente</h3>
                <p className="text-gray-600 text-sm">
                  Proceso completamente visible
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <h3 className="font-semibold text-dark mb-2">Rentable</h3>
                <p className="text-gray-600 text-sm">
                  Mejores márgenes garantizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Company Section */}
      <section id="formulario" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-dark mb-4">
                Crea tu empresa en Suba&Go
              </h2>
              <p className="text-gray-600">
                Únete a la plataforma y comienza a vender con mejores resultados
              </p>
            </div>
            <MultiStepForm />
          </div>
        </div>
      </section>
    </main>
  );
}
