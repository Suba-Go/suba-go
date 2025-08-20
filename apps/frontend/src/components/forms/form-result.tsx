import { TenantDto } from '@suba-go/shared-validation';
import Link from 'next/link';
import { Button } from '@suba-go/shared-components/components/ui/button';

export default function FormResult({ tenantData }: { tenantData: TenantDto }) {
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
            href={tenantData.domain}
            className="text-primary hover:text-primary/80 font-medium break-all"
          >
            {tenantData.domain}
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
            <Link href={tenantData.domain}>Ir a mi empresa</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
