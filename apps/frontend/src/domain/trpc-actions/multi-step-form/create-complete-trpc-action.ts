'use server';
import { trpcServer } from '@/lib/trpc-server';
import {
  UserCreateDto,
  CompanyCreateDto,
  TenantCreateDto,
  UserDto,
  CompanyDto,
  TenantDto,
} from '@suba-go/shared-validation';

export interface MultiStepFormData {
  userData: UserCreateDto;
  companyData: CompanyCreateDto;
  tenantData: TenantCreateDto;
}

export interface MultiStepFormResult {
  user: UserDto;
  company: CompanyDto;
  tenant: TenantDto;
}

export const createCompleteTrpcAction = async (
  data: MultiStepFormData
): Promise<ApiResponse<MultiStepFormResult>> => {
  try {
    const result = await trpcServer.multiStepForm.createComplete.mutate(data);
    return result as ApiResponse<MultiStepFormResult>;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
