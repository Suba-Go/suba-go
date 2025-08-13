import { TenantDto } from '@suba-go/shared-validation';
import Link from 'next/link';

export default function FormResult({ tenantData }: { tenantData: TenantDto }) {
  return (
    <div>
      <h1>Se a creado correctamente tu empresa</h1>
      <Link href={`${tenantData.domain}`} className="underline text-blue-500">
        {tenantData.domain}
      </Link>
    </div>
  );
}
