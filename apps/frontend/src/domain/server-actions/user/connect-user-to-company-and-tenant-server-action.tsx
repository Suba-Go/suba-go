'use server';
import {
  UserSafeDto,
  TenantDto,
  CompanyDto,
  UserSafeWithCompanyAndTenantDto,
} from '@suba-go/shared-validation';
import connectUserToCompanyAndTenant from '@/domain/getway/user/connect-user-to-company-and-tenant';

export const connectUserToCompanyAndTenantServerAction = async (
  tenant: TenantDto,
  user: UserSafeDto,
  company: CompanyDto
): Promise<ApiResponse<UserSafeWithCompanyAndTenantDto>> => {
  return await connectUserToCompanyAndTenant(tenant, user, company);
};
