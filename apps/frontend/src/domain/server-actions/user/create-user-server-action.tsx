'use server';
import createUser from '@/domain/getway/user/create-user';
import { UserCreateDto, UserSafeDto } from '@suba-go/shared-validation';

export const createUserServerAction = async (
  data: UserCreateDto
): Promise<ApiResponse<UserSafeDto>> => {
  const result = await createUser(data);
  return result;
};
