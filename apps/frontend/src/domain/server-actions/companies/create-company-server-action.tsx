'use server';
import createCompany from '@/domain/getway/companies/create-company';
import { CompanyCreateDto, CompanyDto } from '@suba-go/shared-validation';

export const createCompanyServerAction = async (
  company: CompanyCreateDto
): Promise<ApiResponse<CompanyDto>> => {
  const result = await createCompany(company);
  return result;
};
