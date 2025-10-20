import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
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
    try {
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

      // Preparar los datos para la actualización, manejando valores nulos correctamente
      const updatePayload = {
        ...updateData,
        // Asegurar que los campos opcionales se manejen correctamente
        phone: updateData.phone === '' ? null : updateData.phone,
        rut: updateData.rut === '' ? null : updateData.rut,
        public_name: updateData.public_name === '' ? null : updateData.public_name,
      };

      console.log('Update payload:', updatePayload);

      // Actualizar el usuario
      const updatedUser = await this.userPrismaRepository.update(
        userId,
        updatePayload
      );

      // Retornar el usuario sin la contraseña
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userSafe } = updatedUser;
      return userSafe as UserSafeDto;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      
      // Si es un error conocido de NestJS, lo re-lanzamos
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // Para otros errores, lanzar un error interno del servidor con más detalles
      throw new InternalServerErrorException(
        `Error interno al actualizar el perfil: ${error.message}`
      );
    }
  }
}
