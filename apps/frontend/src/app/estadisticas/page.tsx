import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estadísticas | Suba&Go',
  description: 'Descubre los resultados reales de Suba&Go: incrementos de hasta +18% en ganancias comparado con ventas tradicionales.',
};

// Datos de ejemplo basados en las imágenes proporcionadas
const estadisticas = [
  {
    categoria: "Suzuki Swift 1.2 GL Sport",
    sinSubasta: "$9,300,000",
    conSubasta: "$11,000,000",
    ganancia: "+18%",
    año: "2021",
    kilometraje: "46,863 kms",
    ubicacion: "Antofagasta"
  },
  {
    categoria: "Suzuki Swift 1.2 GL Sport", 
    sinSubasta: "$11,000,000",
    conSubasta: "$12,600,000",
    ganancia: "+15%",
    año: "2021",
    kilometraje: "46,863 kms",
    ubicacion: "Antofagasta"
  },
  {
    categoria: "Suzuki Swift 1.2 GL Sport",
    sinSubasta: "$12,300,000", 
    conSubasta: "$13,400,000",
    ganancia: "+7%",
    año: "2021",
    kilometraje: "46,863 kms",
    ubicacion: "Antofagasta"
  },
  {
    categoria: "Suzuki Swift 1.2 GL Sport",
    sinSubasta: "$12,703,000",
    conSubasta: "$13,200,000", 
    ganancia: "+4%",
    año: "2021",
    kilometraje: "75,855 kms",
    ubicacion: "Antofagasta"
  },
  {
    categoria: "Suzuki Swift 1.2 GL Sport",
    sinSubasta: "$7,000,000",
    conSubasta: "$7,600,000",
    ganancia: "+9%",
    año: "2021",
    kilometraje: "51,073 kms", 
    ubicacion: "Antofagasta"
  },
  {
    categoria: "Suzuki Swift 1.2 GL Sport",
    sinSubasta: "$13,350,000",
    conSubasta: "$14,100,000",
    ganancia: "+4%",
    año: "2021",
    kilometraje: "14,869 kms",
    ubicacion: "Antofagasta"
  }
];

export default function EstadisticasPage() {
  const promedioGanancia = estadisticas.reduce((acc, stat) => {
    const ganancia = parseInt(stat.ganancia.replace('%', '').replace('+', ''));
    return acc + ganancia;
  }, 0) / estadisticas.length;

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Estadísticas Reales
            </h1>
            <p className="text-xl leading-relaxed mb-8">
              Resultados comprobados de vendedores que eligieron Suba&Go
            </p>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
              <div className="text-4xl font-bold text-yellow-300 mb-2">
                +{promedioGanancia.toFixed(0)}%
              </div>
              <div className="text-lg">
                Ganancia promedio vs venta tradicional
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Intro */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-dark mb-4">
                ¿Por qué vender con Suba&Go?
              </h2>
              <p className="text-lg text-gray-600">
                Casos reales de vehículos vendidos a través de nuestra plataforma
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {estadisticas.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Suba&Go</span>
                      <span className="text-sm opacity-90">¿Por qué vender con Suba&Go?</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-dark mb-4 text-sm">
                      {stat.categoria}
                    </h3>
                    
                    {/* Comparison */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1 mr-2">
                          <div className="text-xs text-gray-600 mb-1">Sin Subasta</div>
                          <div className="font-bold text-dark">{stat.sinSubasta}</div>
                        </div>
                        <div className="bg-primary/10 rounded-lg px-3 py-2 flex-1 ml-2">
                          <div className="text-xs text-primary mb-1">Con Subasta</div>
                          <div className="font-bold text-primary">{stat.conSubasta}</div>
                        </div>
                      </div>
                    </div>

                    {/* Ganancia */}
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <span className="text-lg font-bold">{stat.ganancia} de ganancia con Suba&Go</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Año:</span>
                        <span>{stat.año}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kilometraje:</span>
                        <span>{stat.kilometraje}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ubicación:</span>
                        <span>{stat.ubicacion}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400 text-center">
                        Mismo modelo • Mismas características • Ventas reales
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-dark mb-4">
                Resultados Consistentes
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Nuestros datos muestran incrementos consistentes en el precio de venta, 
                con ganancias que van desde +4% hasta +18% comparado con ventas tradicionales.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary mb-2">+18%</div>
                  <div className="text-sm text-gray-600">Máxima ganancia registrada</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary mb-2">+{promedioGanancia.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Ganancia promedio</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-gray-600">Casos con ganancia positiva</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
