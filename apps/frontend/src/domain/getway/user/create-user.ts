import 'server-only';
import { UserCreateDto, UserSafeDto } from '@suba-go/shared-validation';
import { fetcher } from '@/utils/wrappers/fetch-wrapper';

export default async function createUser(
  user: UserCreateDto
): Promise<ApiResponse<UserSafeDto>> {
  const result = await fetcher('/users', {
    requireAuth: false,
    body: user,
    method: 'POST',
  });
  return result as ApiResponse<UserSafeDto>;
}
