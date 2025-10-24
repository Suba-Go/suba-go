import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';

// Define User with relations type for this service
// Note: Tenant no longer has a name field - company name is used as subdomain
type UserWithRelations = {
  id: string;
  email: string;
  tenant?: { id: string };
  company?: { name: string; tenant?: { id: string } };
};

interface CompanyLookupResult {
  companyDomain: string;
  companyName: string;
  userId: string;
}

@Injectable()
export class UserLookupService {
  constructor(private readonly userRepository: UserPrismaRepository) {}

  async findCompanyByUserEmail(
    email: string
  ): Promise<CompanyLookupResult | null> {
    try {
      // Find user by email with company and tenant relations
      const user = (await this.userRepository.findByEmailWithRelations(
        email
      )) as UserWithRelations;

      if (!user) {
        return null;
      }

      if (!user.company) {
        throw new NotFoundException(
          'User exists but has no associated company'
        );
      }

      if (!user.tenant) {
        throw new NotFoundException('User exists but has no associated tenant');
      }

      // The company name is the subdomain
      const subdomain = user.company.name;

      return {
        companyDomain: subdomain, // Return the company name as subdomain
        companyName: user.company.name,
        userId: user.id,
      };
    } catch (error) {
      console.error('Error in findCompanyByUserEmail:', error);
      throw error;
    }
  }

  async validateEmailForTenant(
    email: string,
    subdomain: string
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Find user by email with relations
      const user = (await this.userRepository.findByEmailWithRelations(
        email
      )) as UserWithRelations;
      if (!user) {
        return {
          isValid: false,
          message: 'Usuario no encontrado',
        };
      }

      // Check if user has a tenant
      if (!user.tenant) {
        return {
          isValid: false,
          message: 'Usuario no está asociado a ninguna empresa',
        };
      }

      // normalize the company name to match the subdomain format
      const normalizeCompanyName = (name: string): string => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
      };

      // the tenant name is the subdomain, it is normalized to match the subdomain format for comparison
      // for comparison
      const userTenantSubdomain = normalizeCompanyName(user.company.name);

      // compare the normalized tenant name with the requested subdomain
      if (userTenantSubdomain !== subdomain) {
        return {
          isValid: false,
          message: 'Este email no pertenece a esta empresa',
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      console.error('Error in validateEmailForTenant:', error);
      throw error;
    }
  }
}
