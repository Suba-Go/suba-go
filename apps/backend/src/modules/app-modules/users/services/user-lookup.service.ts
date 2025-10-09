import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPrismaRepository } from './user-prisma-repository.service';

// Define User with relations type for this service
type UserWithRelations = {
  id: string;
  email: string;
  tenant?: { domain: string };
  company?: { name: string; tenant?: { domain: string } };
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

      // Extract subdomain from full domain URL
      let subdomain = user.tenant.domain;

      // If domain is a full URL, extract just the subdomain part
      if (subdomain.includes('://')) {
        try {
          const url = new URL(subdomain);
          const hostname = url.hostname;
          // Extract subdomain (everything before the first dot)
          subdomain = hostname.split('.')[0];
        } catch (error) {
          console.error('Error parsing domain URL:', error);
          // Fallback: try to extract subdomain manually
          subdomain = subdomain.replace(/^https?:\/\//, '').split('.')[0];
        }
      }

      return {
        companyDomain: subdomain, // Return only the subdomain part
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

      // The tenant.domain stores the full URL (e.g., "http://nicocompany.localhost:3000")
      // We need to extract the subdomain from it
      const userTenantDomain = user.tenant.domain;

      // Extract subdomain from the full domain URL
      let extractedSubdomain = userTenantDomain;

      // If domain is a full URL, extract just the subdomain part
      if (userTenantDomain.includes('://')) {
        try {
          const url = new URL(userTenantDomain);
          const hostname = url.hostname;
          // Extract subdomain (everything before the first dot)
          extractedSubdomain = hostname.split('.')[0];
        } catch (error) {
          console.error('Error parsing domain URL:', error);
          // Fallback: try to extract subdomain manually
          extractedSubdomain = userTenantDomain
            .replace(/^https?:\/\//, '')
            .split('.')[0];
        }
      }

      // Compare the extracted subdomain with the requested subdomain
      if (extractedSubdomain !== subdomain) {
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
