import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyCreateDto } from '@suba-go/shared-validation';
import { Company } from '../company.entity';
import { CompanyRepository } from './company-repository.service';
import { TenantRepository } from '../../tenants/services/tenant-repository.service';

@Injectable()
export class CompanyCreatorService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly tenantRepository: TenantRepository
  ) {}

  async createCompany(
    companyData: CompanyCreateDto,
    tenantId: string
  ): Promise<Company> {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findById(tenantId);

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

    // Create company
    return await this.companyRepository.create({
      name: companyData.name,
      logo: companyData.logo,
      principal_color: companyData.principal_color,
      principal_color2: companyData.principal_color2,
      secondary_color: companyData.secondary_color,
      secondary_color2: companyData.secondary_color2,
      secondary_color3: companyData.secondary_color3,
      tenant: tenant,
    });
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
