import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Eye, Timer, BarChart3, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Qué hacemos | Suba&Go',
  description:
    'Redefinimos la forma de vender. Suba&Go transforma las subastas en una estrategia de venta transparente y rentable.',
};

export default function QueHacemosPage() {
  return (
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-24 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-800 to-transparent opacity-50" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Redefinimos la forma de vender: <br />
              <span className="text-yellow-400">
                Vender mejor no es suerte, es una estrategia.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-10">
              El precio mínimo es solo el punto de partida. En nuestra
              plataforma, cada oferta empuja el valor hacia arriba de forma
              transparente, eliminando las negociaciones opacas y maximizando tu
              retorno.
            </p>
            <div className="flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg shadow-yellow-400/20"
              >
                Ver cómo funciona
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Efecto de Tensión Positivo */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-400 transition-colors">
                <TrendingUp className="w-8 h-8 text-yellow-600 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Efecto de Tensión Positivo
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Crear competencia libre de condiciones para que cada oferta
                empuje el precio al alza.
              </p>
            </div>

            {/* Card 2: Transparencia Total */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gray-900 transition-colors">
                <Eye className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Transparencia Total
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Ofertas visibles y trazables, eliminando negociaciones opacas.
              </p>
            </div>

            {/* Card 3: Proceso Ágil */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-400 transition-colors">
                <Timer className="w-8 h-8 text-yellow-600 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Proceso Ágil
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Venta concretada en minutos. Crea el producto, invita y cierra.
              </p>
            </div>

            {/* Card 4: Mayor Rentabilidad */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gray-900 transition-colors">
                <BarChart3 className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mayor Rentabilidad
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Mejores márgenes sin bajar el precio mínimo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-900 py-20 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            ¿Listo para escalar tus ventas?
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-transparent border-2 border-primary text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-primary hover:text-white transition-all"
          >
            Comenzar ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
