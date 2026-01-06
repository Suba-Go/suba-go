import MultiStepForm from '@/components/forms/multi-step-form';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  TrendingUp,
  Zap,
  Eye,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suba&Go - Plataforma de Subastas B2B',
  description:
    'Maximiza tus márgenes con subastas en vivo. La plataforma tecnológica donde la confianza se convierte en rentabilidad.',
};

export default function Home() {
  return (
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark via-gray-900 to-black text-white py-24 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-gray-800/30 to-transparent pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-primary text-sm font-medium">
              🚀 Revolucionando las ventas B2B
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
              La forma más <span className="text-primary">simple</span> y{' '}
              <span className="text-primary">rentable</span> de vender
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              Una plataforma de subastas donde la confianza no es magia, es{' '}
              <span className="font-semibold text-white">margen</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/que-hacemos"
                className="bg-primary text-dark px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg shadow-primary/25 flex items-center gap-2"
              >
                Descubre cómo funciona
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-soft-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-6">
              ¿Qué produce Suba&Go?
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Subastar en vivo frente a múltiples interesados genera un{' '}
              <span className="font-bold text-primary">
                efecto de tensión positivo
              </span>{' '}
              que eleva tu precio de venta. Tu precio mínimo se convierte en un
              punto de partida que gana fuerza con cada oferta.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
                <ShieldCheck className="w-8 h-8 text-yellow-600 group-hover:text-dark transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">Más Justa</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Precios determinados por el mercado real, sin especulaciones.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
                <Zap className="w-8 h-8 text-yellow-600 group-hover:text-dark transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">Más Ágil</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Proceso rápido y eficiente. Cierra ventas en minutos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
                <Eye className="w-8 h-8 text-yellow-600 group-hover:text-dark transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">Transparente</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Proceso completamente visible y trazable para todos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary transition-colors duration-300">
                <TrendingUp className="w-8 h-8 text-yellow-600 group-hover:text-dark transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-3">Rentable</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Mejores márgenes garantizados mediante competencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Create Company Section */}
      <section
        id="formulario"
        className="py-24 bg-white border-t border-gray-100"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
                <BarChart3 className="w-4 h-4" />
                Comienza Hoy
              </div>
              <h2 className="text-4xl font-bold text-dark mb-6">
                Crea tu empresa en Suba&Go
              </h2>
              <p className="text-xl text-gray-600">
                Únete a la plataforma líder y comienza a vender con mejores
                resultados desde el primer día.
              </p>
            </div>
            <div className="bg-soft-white p-8 rounded-3xl border border-gray-100 shadow-lg">
              <MultiStepForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
