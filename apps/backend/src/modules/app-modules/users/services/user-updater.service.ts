import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';
import { UserUpdateProfileDto, UserSafeDto } from '@suba-go/shared-validation';

@Injectable()
export class UserUpdaterService {
  constructor(private readonly userPrismaRepository: UserPrismaRepository) {}

  async updateUserProfile(
    userId: string,
    updateData: UserUpdateProfileDto
  ): Promise<UserSafeDto> {
    // Verificar que el usuario existe
    const existingUser = await this.userPrismaRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no esté en uso por otro usuario
    if (updateData.email && updateData.email !== existingUser.email) {
      const userWithEmail = await this.userPrismaRepository.findByEmail(
        updateData.email
      );
      if (userWithEmail && userWithEmail.id !== userId) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    // Si se está actualizando el RUT, verificar que no esté en uso por otro usuario
    if (updateData.rut && updateData.rut !== existingUser.rut) {
      const userWithRut = await this.userPrismaRepository.findByRut(
        updateData.rut
      );
      if (userWithRut && userWithRut.id !== userId) {
        throw new ConflictException('El RUT ya está en uso por otro usuario');
      }
    }

    // Actualizar el usuario
    const updatedUser = await this.userPrismaRepository.update(
      userId,
      updateData
    );

    // Retornar el usuario sin la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = updatedUser;
    return userSafe as UserSafeDto;
  }
}
