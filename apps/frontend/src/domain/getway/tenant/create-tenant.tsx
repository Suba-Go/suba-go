import 'server-only';
import { fetcher } from '@/utils/wrappers/fetch-wrapper';
import { TenantCreateDto, TenantDto } from '@suba-go/shared-validation';

export default async function createTenant(
  tenant: TenantCreateDto
): Promise<ApiResponse<TenantDto>> {
  const result = await fetcher('/tenants', {
    requireAuth: false,
    method: 'POST',
    body: tenant,
  });
  return result as ApiResponse<TenantDto>;
}
