'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ProfileIncompleteWarningProps {
  missingFieldsCount: number;
  companyName?: string;
}

export function ProfileIncompleteWarning({ 
  missingFieldsCount, 
  companyName 
}: ProfileIncompleteWarningProps) {
  const router = useRouter();

  const handleGoToOnboarding = () => {
    router.push('/perfil');
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Perfil incompleto
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Para acceder a todas las funcionalidades de {companyName || 'tu empresa'}, 
              necesitas completar tu perfil. 
              {missingFieldsCount === 1 
                ? ' Falta 1 campo por completar.'
                : ` Faltan ${missingFieldsCount} campos por completar.`
              }
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={handleGoToOnboarding}
              className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              Completar perfil
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
