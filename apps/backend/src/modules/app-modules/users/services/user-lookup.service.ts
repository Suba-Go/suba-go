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
}
