import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';
import { normalizeCompanyName } from '../../../../utils/company-normalization';

// Define User with relations type for this service
// Note: Tenant no longer has a name field - company name is used as subdomain

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
      const user = await this.userRepository.findByEmailWithRelations(email);

      if (!user) {
        return null;
      }

      if (!user.companyId || !user.company) {
        throw new NotFoundException(
          'User exists but has no associated company'
        );
      }

      if (!user.tenantId) {
        throw new NotFoundException('User exists but has no associated tenant');
      }

      // The normalized company name is the subdomain
      const subdomain = normalizeCompanyName(user.company.name);

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
      const user = await this.userRepository.findByEmailWithRelations(email);
      if (!user) {
        return {
          isValid: false,
          message: 'Usuario no encontrado',
        };
      }

      // Check if user has a tenant
      if (!user.tenantId) {
        return {
          isValid: false,
          message: 'Usuario no está asociado a ninguna empresa',
        };
      }

      // the tenant name is the subdomain, it is normalized to match the subdomain format for comparison
      if (!user.company) {
        return {
          isValid: false,
          message: 'Usuario no tiene empresa asociada',
        };
      }

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
