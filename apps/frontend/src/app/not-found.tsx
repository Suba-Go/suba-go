'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium  py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Volver al inicio
          </Link>

          <div className="text-sm text-gray-500">
            <button
              onClick={() => window.history.back()}
              className="hover:text-gray-700 transition-colors duration-200"
            >
              ← Página anterior
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
