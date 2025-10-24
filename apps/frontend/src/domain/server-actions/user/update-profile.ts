'use server';

import { fetcher } from '@/utils/wrappers/fetch-wrapper';
import { UserUpdateProfileDto } from '@suba-go/shared-validation';

export async function updateUserProfileAction(
  userId: string,
  updateData: UserUpdateProfileDto
) {
  try {
    const result = await fetcher(`/users/${userId}/profile`, {
      method: 'PATCH',
      body: updateData,
      requireAuth: true,
    }, 'ProfileUpdateErrors');

    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar el perfil');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
