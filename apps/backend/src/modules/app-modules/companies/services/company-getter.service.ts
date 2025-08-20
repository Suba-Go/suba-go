import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company-repository.service';
import { TenantRepository } from '../../tenants/services/tenant-repository.service';
import { Company } from '../company.entity';

@Injectable()
export class CompanyGetterService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly tenantRepository: TenantRepository
  ) {}

  async getCompanyBySubdomain(subdomain: string): Promise<Company> {
    // Build domain based on environment to find the tenant
    const domain =
      process.env.NODE_ENV === 'development'
        ? `http://${subdomain}.localhost:3000`
        : `https://www.${subdomain}.subago.cl`;

    // Find tenant by domain
    let tenant = await this.tenantRepository.findByDomain(domain);

    // If not found with www prefix, try without it (for backward compatibility)
    if (!tenant && process.env.NODE_ENV !== 'development') {
      const alternativeDomain = `https://${subdomain}.subago.cl`;
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
