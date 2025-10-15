import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyPrismaRepository } from './company-prisma-repository.service';
import { TenantPrismaRepository } from '../../tenants/services/tenant-prisma-repository.service';
import type { Company } from '@prisma/client';

@Injectable()
export class CompanyGetterService {
  constructor(
    private readonly companyRepository: CompanyPrismaRepository,
    private readonly tenantRepository: TenantPrismaRepository
  ) {}

  async getCompanyBySubdomain(subdomain: string): Promise<Company> {
    // Build domain based on environment to find the tenant
    const rootDomain = process.env.ROOT_DOMAIN || 'subago.cl';
    const isLocalDevelopment =
      process.env.NODE_ENV === 'development' && !process.env.VERCEL;

    const domain = isLocalDevelopment
      ? `http://${subdomain}.localhost:3000`
      : `https://${subdomain}.${rootDomain}`;

    // Find tenant by domain
    let tenant = await this.tenantRepository.findByDomain(domain);

    // If not found, try with www prefix (for backward compatibility)
    if (!tenant && !isLocalDevelopment) {
      const alternativeDomain = `https://www.${subdomain}.${rootDomain}`;
      tenant = await this.tenantRepository.findByDomain(alternativeDomain);
    }

    if (!tenant) {
      throw new NotFoundException(
        `No se encontró tenant para el subdominio: ${subdomain}`
      );
    }

    // Find company by tenant (assuming one company per tenant for now)
    const companies = await this.companyRepository.findByTenant(tenant.id);
    if (!companies || companies.length === 0) {
      throw new NotFoundException(
        `No se encontró empresa para el subdominio: ${subdomain}`
      );
    }

    // Return the first company (in the future, we might need to handle multiple companies per tenant)
    return companies[0];
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('La empresa especificada no existe');
    }
    return company;
  }
}
