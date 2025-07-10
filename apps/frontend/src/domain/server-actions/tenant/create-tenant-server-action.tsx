'use server';
import createTenant from '@/domain/getway/tenant/create-tenant';
import { TenantCreateDto, TenantDto } from '@suba-go/shared-validation';

export const createTenantServerAction = async (
  tenant: TenantCreateDto
): Promise<ApiResponse<TenantDto>> => {
  const result = await createTenant(tenant);
  return result;
};
