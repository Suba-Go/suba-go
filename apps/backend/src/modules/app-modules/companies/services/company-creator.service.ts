import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Company, Prisma } from '@prisma/client';
import { CompanyPrismaRepository } from './company-prisma-repository.service';
import { TenantPrismaRepository } from '../../tenants/services/tenant-prisma-repository.service';
import { normalizeCompanyName } from '../../../../utils/company-normalization';
import {
  CompanyCreateCompactDto,
  CompanyWithTenantDto,
} from '@suba-go/shared-validation';

@Injectable()
export class CompanyCreatorService {
  constructor(
    private readonly companyRepository: CompanyPrismaRepository,
    private readonly tenantRepository: TenantPrismaRepository
  ) {}

  async createCompany(
    companyData: CompanyCreateCompactDto,
    tenantId?: string
  ): Promise<CompanyWithTenantDto> {
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
    const tenantToConnectId = tenant?.id ?? tenantId;
    if (!tenantToConnectId) {
      throw new BadRequestException(
        'El tenantId es requerido para crear empresa'
      );
    }

    // Create company with normalized name for case-insensitive subdomain lookup
    return await this.companyRepository.create({
      name: companyData.name,
      nameLowercase: normalizeCompanyName(companyData.name),
      principal_color: companyData.principal_color,
      tenant: { connect: { id: tenantToConnectId } },
    } as Prisma.CompanyCreateInput);
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
