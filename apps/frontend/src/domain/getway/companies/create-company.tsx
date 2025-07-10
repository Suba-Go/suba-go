import 'server-only';
import { fetcher } from '@/utils/wrappers/fetch-wrapper';
import { CompanyCreateDto, CompanyDto } from '@suba-go/shared-validation';

export default async function createCompany(
  company: CompanyCreateDto
): Promise<ApiResponse<CompanyDto>> {
  const result = await fetcher('/companies', {
    requireAuth: false,
    method: 'POST',
    body: company,
  });
  return result as ApiResponse<CompanyDto>;
}
