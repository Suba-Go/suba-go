import { Metadata } from 'next';
import Image from 'next/image';
import { Wrench, Users, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre nosotros | Suba&Go',
  description:
    'Conoce al equipo detrás de Suba&Go. Construimos una plataforma simple, confiable y escalable para maximizar tus ventas.',
};

export default function SobreNosotrosPage() {
  return (
    <main className="flex-1 bg-white">
      {/* Hero Section - Mission */}
      <section className="bg-gray-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
              Sobre nosotros
            </h1>
            <p className="text-xl md:text-3xl font-light leading-relaxed text-gray-300">
              &quot;Construir una plataforma{' '}
              <span className="text-yellow-400 font-medium">
                simple, confiable y escalable
              </span>{' '}
              para que nuestros clientes ganen más, eliminando negociaciones
              opacas&quot;.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestro Equipo
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Liderado por expertos en estrategia comercial y tecnología
              aplicada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Juan Aspillaga */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border border-gray-100 flex flex-col">
              <div className="aspect-[4/3] relative w-full bg-gray-200">
                <img
                  src="https://g95bzcjyoeattqzt.public.blob.vercel-storage.com/WhatsApp%20Image%202026-01-05%20at%2021.17.48.jpeg"
                  alt="Juan Aspillaga"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-center text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Juan Aspillaga
                </h3>
                <p className="text-yellow-600 font-semibold mb-4">CEO</p>
                <p className="text-gray-600 leading-relaxed">
                  Ingeniero Comercial con formación internacional y experto en
                  estrategia de ventas.
                </p>
              </div>
            </div>

            {/* Nicolás Hörmann */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border border-gray-100 flex flex-col">
              <div className="aspect-[4/3] relative w-full bg-gray-200">
                <img
                  src="https://g95bzcjyoeattqzt.public.blob.vercel-storage.com/nicofin.png"
                  alt="Nicolás Hörmann"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-center text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Nicolás Hörmann
                </h3>
                <p className="text-yellow-600 font-semibold mb-4">CTO / CDO</p>
                <p className="text-gray-600 leading-relaxed">
                  Ingeniero en Ciencias de la Computación de la PUC,
                  especialista en tecnología aplicada y experiencia en el sector
                  automotriz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Value 1: Útil */}
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wrench className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Útil</h3>
              <p className="text-gray-600 leading-relaxed">
                Resolvemos problemas reales con impacto directo en los
                resultados.
              </p>
            </div>

            {/* Value 2: Accesible */}
            <div className="text-center px-4 border-l border-r border-gray-100 md:border-x">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Accesible
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tecnología que facilita la toma de decisiones, no la complica.
              </p>
            </div>

            {/* Value 3: Profesional */}
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Profesional
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Estándares claros y foco en resultados medibles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
