import 'server-only';
import { fetcher } from '@/utils/wrappers/fetch-wrapper';
import {
  UserSafeDto,
  TenantDto,
  CompanyDto,
  UserSafeWithCompanyAndTenantDto,
} from '@suba-go/shared-validation';

export default async function connectUserToCompanyAndTenant(
  tenant: TenantDto,
  user: UserSafeDto,
  company: CompanyDto
): Promise<ApiResponse<UserSafeWithCompanyAndTenantDto>> {
  const result = await fetcher('/user/connect-user-to-company-and-tenant', {
    method: 'POST',
    body: { tenant, user, company },
  });
  return result as ApiResponse<UserSafeWithCompanyAndTenantDto>;
}
