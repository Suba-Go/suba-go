'use server';
import { trpcServer } from '@/lib/trpc-server';
import { UserCreateDto, UserSafeDto } from '@suba-go/shared-validation';

export const createUserTrpcAction = async (
  data: UserCreateDto
): Promise<ApiResponse<UserSafeDto>> => {
  try {
    const result = await trpcServer.user.create.mutate(data);
    return result as ApiResponse<UserSafeDto>;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
