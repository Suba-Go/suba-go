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
      const existingUser = await this.userPrismaRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Validate email uniqueness
      if (updateData.email && updateData.email !== existingUser.email) {
        const userWithEmail = await this.userPrismaRepository.findByEmail(
          updateData.email
        );
        if (userWithEmail && userWithEmail.id !== userId) {
          throw new ConflictException('El email ya está en uso por otro usuario');
        }
      }

      // Validate RUT uniqueness
      if (updateData.rut && updateData.rut !== existingUser.rut) {
        const userWithRut = await this.userPrismaRepository.findByRut(
          updateData.rut
        );
        if (userWithRut && userWithRut.id !== userId) {
          throw new ConflictException('El RUT ya está en uso por otro usuario');
        }
      }


      const updatePayload = {
        ...updateData,
        phone: updateData.phone === '' ? null : updateData.phone,
        rut: updateData.rut === '' ? null : updateData.rut,
        public_name: updateData.public_name === '' ? null : updateData.public_name,
      };

      // Update user and return safe data
      const updatedUser = await this.userPrismaRepository.update(
        userId,
        updatePayload
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userSafe } = updatedUser;
      return userSafe as UserSafeDto;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Error interno al actualizar el perfil: ${error.message}`
      );
    }
  }
}
