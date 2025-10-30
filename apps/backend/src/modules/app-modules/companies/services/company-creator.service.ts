import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyCreateDto } from '@suba-go/shared-validation';
import type { Company, Prisma } from '@prisma/client';
import { CompanyPrismaRepository } from './company-prisma-repository.service';
import { TenantPrismaRepository } from '../../tenants/services/tenant-prisma-repository.service';
import { normalizeCompanyName } from '../../../../utils/company-normalization';

type CompanyCreateInputWithNormalized = Prisma.CompanyCreateInput & {
  nameLowercase: string;
};

@Injectable()
export class CompanyCreatorService {
  constructor(
    private readonly companyRepository: CompanyPrismaRepository,
    private readonly tenantRepository: TenantPrismaRepository
  ) {}

  async createCompany(
    companyData: CompanyCreateDto,
    tenantId?: string
  ): Promise<Company> {
    let tenant = null;

    if (tenantId) {
      // Validate tenant exists
      tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new BadRequestException('El tenant especificado no existe');
      }

      // Check if company with same name already exists for this tenant
      const existingCompany = await this.companyRepository.findByNameAndTenant(
        companyData.name,
        tenantId
      );

      if (existingCompany) {
        throw new ConflictException(
          'Ya existe una empresa con este nombre en el tenant'
        );
      }
    }

    // Create company with normalized name for case-insensitive subdomain lookup
    return await this.companyRepository.create({
      name: companyData.name,
      nameLowercase: normalizeCompanyName(companyData.name),
      logo: companyData.logo,
      principal_color: companyData.principal_color,
      principal_color2: companyData.principal_color2,
      secondary_color: companyData.secondary_color,
      secondary_color2: companyData.secondary_color2,
      secondary_color3: companyData.secondary_color3,
      tenant: tenant
        ? { connect: { id: tenant.id } }
        : { connect: { id: tenantId } },
    } as CompanyCreateInputWithNormalized);
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    return await this.companyRepository.findByTenant(tenantId);
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new BadRequestException('La empresa especificada no existe');
    }

    return company;
  }
}
