'use server';
import { trpcServer } from '@/lib/trpc-server';
import { CompanyCreateDto, CompanyDto } from '@suba-go/shared-validation';

export const createCompanyTrpcAction = async (
  data: CompanyCreateDto
): Promise<ApiResponse<CompanyDto>> => {
  try {
    const result = await trpcServer.company.create.mutate(data);
    return result as ApiResponse<CompanyDto>;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
