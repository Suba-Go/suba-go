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
    // The subdomain is the company name
    // Find company directly by name (case-insensitive)
    const company = await this.companyRepository.findByName(subdomain);

    if (!company) {
      throw new NotFoundException(
        `No se encontró empresa para el subdominio: ${subdomain}`
      );
    }

    return company;
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('La empresa especificada no existe');
    }
    return company;
  }
}
