import { Metadata } from 'next';
import { SimpleWebSocketTest } from '@/components/websocket/simple-websocket-test';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Dashboard | Suba&Go',
  description: 'Panel de control de tu empresa en Suba&Go.',
};

export default async function DashboardPage() {
  // Get access token from cookies for WebSocket authentication
  const session = await auth();
  const accessToken = session?.tokens.accessToken || '';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-lg text-gray-600 mb-8">
            Bienvenido a tu panel de control
          </p>
        </div>

        {/* WebSocket Test Component */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-blue-900">
              🧪 WebSocket Handshake Test
            </h2>
            <p className="text-sm text-blue-700">
              Simple test to verify WebSocket connection and double handshake.
              No tenant IDs or auction IDs needed - just pure connection
              testing!
            </p>
          </div>
          <SimpleWebSocketTest accessToken={accessToken} />
        </div>

        {/* Original Dashboard Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configuración de tu empresa
          </h2>
          <p className="text-gray-600">
            Tu empresa ha sido creada exitosamente. Pronto podrás acceder a
            todas las funcionalidades de Suba&Go.
          </p>
        </div>
      </div>
    </div>
  );
}
