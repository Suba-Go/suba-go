import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Suba&Go',
  description: 'Panel de control de tu empresa en Suba&Go.',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Bienvenido a tu panel de control
          </p>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuración de tu empresa
            </h2>
            <p className="text-gray-600">
              Tu empresa ha sido creada exitosamente. Pronto podrás acceder a todas las funcionalidades de Suba&Go.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
