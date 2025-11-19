import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';
import { normalizeCompanyName } from '../../../../utils/company-normalization';

// Define User with relations type for this service
type UserWithRelations = {
  id: string;
  email: string;
  company?: { name: string; nameLowercase?: string; tenant?: { name: string } };
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

    // Return the normalized company name (which is the subdomain)
    return normalizeCompanyName(user.company.name);
  }
}
