import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estadísticas | Suba&Go',
  description:
    'Descubre los resultados reales de Suba&Go: incrementos de hasta +18% en ganancias comparado con ventas tradicionales.',
};

export default function EstadisticasPage() {
  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Estadísticas</h1>
            <p className="text-xl leading-relaxed mb-8">
              Página en construcción
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
