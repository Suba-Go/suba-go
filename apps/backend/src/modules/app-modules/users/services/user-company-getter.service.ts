import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';

// Define User with relations type for this service
type UserWithRelations = {
  id: string;
  email: string;
  company?: { name: string; tenant?: { name: string } };
};

@Injectable()
export class UserCompanyGetterService {
  constructor(private readonly userRepository: UserPrismaRepository) {}

  async getUserCompanyDomain(userEmail: string): Promise<string> {
    // Find user by email with company and tenant relations
    const user = (await this.userRepository.findByEmailWithRelations(
      userEmail
    )) as UserWithRelations;
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

    // Return the tenant name (which is the subdomain)
    return user.company.name;
  }
}
