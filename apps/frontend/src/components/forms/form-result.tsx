import { CompanyDto } from '@suba-go/shared-validation';
import Link from 'next/link';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { getNodeEnv } from '@suba-go/shared-components';

// Helper to build company URL based on environment
function getCompanyUrl(companyName: string): string {
  if (typeof window === 'undefined') return '#';

  const nodeEnv = getNodeEnv();

  if (nodeEnv === 'local') {
    // Local: http://{company}.localhost:3000
    return `http://${companyName}.localhost:3000/login`;
  } else if (nodeEnv === 'development') {
    // Development: https://{company}.development.subago.cl
    return `https://${companyName}.development.subago.cl/login`;
  } else {
    // Production: https://{company}.subago.cl
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'subago.cl';
    return `https://${companyName}.${rootDomain}/login`;
  }
}

export default function FormResult({
  companyData,
}: {
  companyData: CompanyDto;
}) {
  const companyUrl = getCompanyUrl(companyData.name);
  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-dark">
          ¡Empresa creada exitosamente!
        </h2>
        <p className="text-gray-600">
          Tu empresa ha sido configurada y ya puedes comenzar a usar Suba&Go
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-dark">Tu página personalizada:</h3>
        <div className="bg-white rounded border p-3">
          <Link
            href={companyUrl}
            className="text-primary hover:text-primary/80 font-medium break-all"
          >
            {companyUrl}
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Si no fuiste redirigido automáticamente, puedes acceder a tu empresa
          usando el enlace de arriba
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={companyUrl}>Ir a mi empresa</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
