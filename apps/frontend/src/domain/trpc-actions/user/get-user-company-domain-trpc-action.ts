'use server';
import { trpcServer } from '@/lib/trpc-server';

export const getUserCompanyDomainTrpcAction = async (
  email: string
): Promise<ApiResponse<{ domain: string }>> => {
  try {
    const result = await trpcServer.user.getCompanyDomain.query({ email });
    return result as ApiResponse<{ domain: string }>;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
