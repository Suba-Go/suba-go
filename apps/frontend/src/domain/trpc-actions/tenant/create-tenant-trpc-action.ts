'use server';
import { trpcServer } from '@/lib/trpc-server';
import { TenantCreateDto, TenantDto } from '@suba-go/shared-validation';

export const createTenantTrpcAction = async (
  data: TenantCreateDto
): Promise<ApiResponse<TenantDto>> => {
  try {
    const result = await trpcServer.tenant.create.mutate(data);
    return result as ApiResponse<TenantDto>;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
