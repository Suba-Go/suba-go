import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user-repository.service';

@Injectable()
export class UserCompanyGetterService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserCompanyDomain(userEmail: string): Promise<string> {
    // Find user by email with company and tenant relations
    const user = await this.userRepository.findByEmailWithRelations(userEmail);
    if (!user) {
      throw new NotFoundException(`Usuario no encontrado: ${userEmail}`);
    }

    // Check if user has a company
    if (!user.company) {
      throw new NotFoundException(
        `El usuario ${userEmail} no tiene una empresa asignada`
      );
    }

    // Check if company has a tenant
    if (!user.company.tenant) {
      throw new NotFoundException(
        `La empresa del usuario ${userEmail} no tiene un tenant asignado`
      );
    }

    return user.company.tenant.domain;
  }
}
