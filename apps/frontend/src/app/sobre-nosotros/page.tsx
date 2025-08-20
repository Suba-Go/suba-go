import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre nosotros | Suba&Go',
  description:
    'Conoce a los jóvenes emprendedores detrás de Suba&Go, construyendo una plataforma útil, accesible y profesional para revolucionar las ventas.',
};

export default function SobreNosotrosPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark via-dark/95 to-dark/90 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Sobre nosotros</h1>
            <p className="text-xl leading-relaxed">
              Somos jóvenes emprendedores construyendo una plataforma útil,
              accesible y profesional
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Mission Statement */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-dark mb-6">
                Nuestra Misión
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                Construimos una plataforma pensada tanto para{' '}
                <span className="font-semibold text-primary">
                  grandes empresas
                </span>{' '}
                como para{' '}
                <span className="font-semibold text-primary">
                  quienes venden por primera vez
                </span>
                .
              </p>
            </div>

            {/* Values Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">Útil</h3>
                <p className="text-gray-600">
                  Creamos herramientas que realmente resuelven problemas y
                  agregan valor a nuestros usuarios.
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Accesible
                </h3>
                <p className="text-gray-600">
                  Diseñamos experiencias simples e intuitivas para usuarios de
                  todos los niveles.
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
                <h3 className="text-xl font-semibold text-dark mb-3">
                  Profesional
                </h3>
                <p className="text-gray-600">
                  Mantenemos los más altos estándares de calidad y confiabilidad
                  en todo lo que hacemos.
                </p>
              </div>
            </div>

            {/* Current Focus */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-12">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12M13 7a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-dark mb-3">
                    Enfoque Actual: Rubro Automotriz
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Hoy operamos en el rubro automotriz, donde hemos
                    perfeccionado nuestro modelo de subastas para maximizar el
                    valor de cada vehículo. Esta especialización nos ha
                    permitido entender profundamente las necesidades específicas
                    del sector.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-dark mb-4">
                Únete a la Revolución de las Ventas
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Descubre cómo Suba&Go puede transformar tu forma de vender y
                maximizar tus resultados.
              </p>
              <Link
                href="/#formulario"
                className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                <span>Comenzar ahora</span>
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
