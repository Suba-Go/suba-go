import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  UserCreateDto,
  CompanyCreateDto,
  TenantCreateDto,
} from '@suba-go/shared-validation';
import { User } from '../../users/user.entity';
import { Company } from '../../companies/company.entity';
import { Tenant } from '../../tenants/tenant.entity';
import { UserRepository } from '../../users/services/user-repository.service';
import { CompanyRepository } from '../../companies/services/company-repository.service';
import { TenantRepository } from '../../tenants/services/tenant-repository.service';
import * as bcrypt from 'bcrypt';

export interface MultiStepFormData {
  userData: UserCreateDto;
  companyData: CompanyCreateDto;
  tenantData: TenantCreateDto;
}

export interface MultiStepFormResult {
  user: User;
  company: Company;
  tenant: Tenant;
}

@Injectable()
export class MultiStepFormCreatorService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly tenantRepository: TenantRepository
  ) {}

  async createCompleteAccount(
    data: MultiStepFormData
  ): Promise<MultiStepFormResult> {
    // Use a database transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      // Step 1: Validate that user doesn't already exist
      const existingUser = await this.userRepository.findByEmail(
        data.userData.email
      );
      if (existingUser) {
        throw new BadRequestException('El usuario con este email ya existe');
      }

      // Step 2: Validate RUT if provided
      if (data.userData.rut) {
        const existingUserByRut = await this.userRepository.findByRut(
          data.userData.rut
        );
        if (existingUserByRut) {
          throw new BadRequestException('El usuario con este RUT ya existe');
        }
      }

      // Step 3: Create tenant first (within transaction)
      const baseDomain =
        process.env.NODE_ENV === 'development'
          ? `${process.env.FRONTEND_URL}`
          : 'subago.com';
      const domain = `https://${data.tenantData.subdomain}.${baseDomain}`;

      // Check if tenant with same domain already exists
      const existingTenant = await this.tenantRepository.findByDomain(domain);
      if (existingTenant) {
        throw new BadRequestException('Ya existe un tenant con este dominio');
      }

      // Check if tenant with same name already exists
      const existingTenantByName = await this.tenantRepository.findByName(
        data.tenantData.name
      );
      if (existingTenantByName) {
        throw new BadRequestException('Ya existe un tenant con este nombre');
      }

      const tenant = manager.create(Tenant, {
        name: data.tenantData.name,
        domain: domain,
      });
      const savedTenant = await manager.save(tenant);

      // Step 4: Create company with tenant reference (within transaction)
      // Check if company with same name already exists for this tenant
      const existingCompany = await manager.findOne(Company, {
        where: {
          name: data.companyData.name,
          tenant: { id: savedTenant.id },
          isDeleted: false,
        },
      });

      if (existingCompany) {
        throw new BadRequestException(
          'Ya existe una empresa con este nombre en el tenant'
        );
      }

      const company = manager.create(Company, {
        name: data.companyData.name,
        logo: data.companyData.logo,
        principal_color: data.companyData.principal_color,
        principal_color2: data.companyData.principal_color2,
        secondary_color: data.companyData.secondary_color,
        secondary_color2: data.companyData.secondary_color2,
        secondary_color3: data.companyData.secondary_color3,
        tenant: savedTenant,
      });
      const savedCompany = await manager.save(company);

      // Step 5: Create user with tenant and company references (within transaction)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        data.userData.password,
        saltRounds
      );

      const user = manager.create(User, {
        name: data.userData.name,
        email: data.userData.email,
        phone: data.userData.phone,
        password: hashedPassword,
        rut: data.userData.rut,
        public_name: data.userData.public_name,
        role: data.userData.role,
        tenant: savedTenant,
        company: savedCompany,
      });
      const savedUser = await manager.save(user);

      return {
        user: savedUser,
        company: savedCompany,
        tenant: savedTenant,
      };
    });
  }
}
