import { Injectable, BadRequestException } from '@nestjs/common';
import {
  UserCreateDto,
  CompanyCreateDto,
  TenantCreateDto,
} from '@suba-go/shared-validation';
import type { User, Company, Tenant } from '@prisma/client';
import { UserPrismaRepository } from '../../users/services/user-prisma-repository.service';
import { CompanyPrismaRepository } from '../../companies/services/company-prisma-repository.service';
import { TenantPrismaRepository } from '../../tenants/services/tenant-prisma-repository.service';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly userRepository: UserPrismaRepository,
    private readonly companyRepository: CompanyPrismaRepository,
    private readonly tenantRepository: TenantPrismaRepository
  ) {}

  async createCompleteAccount(
    data: MultiStepFormData
  ): Promise<MultiStepFormResult> {
    // Use Prisma transaction to ensure atomicity
    return await this.prisma.executeTransaction(async (prisma) => {
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
      // Build domain based on environment
      const domain =
        process.env.NODE_ENV === 'development'
          ? `http://${data.tenantData.subdomain}.localhost:3000` // Development: subdomain.localhost:3000
          : `https://www.${data.tenantData.subdomain}.subago.cl`; // Production: www.subdomain.subago.cl

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

      // Step 4: Create tenant (within transaction)
      const savedTenant = await prisma.tenant.create({
        data: {
          name: data.tenantData.name,
          domain: domain,
        },
      });

      // Step 5: Create company with tenant reference (within transaction)
      // Check if company with same name already exists for this tenant
      const existingCompany = await prisma.company.findFirst({
        where: {
          name: data.companyData.name,
          tenantId: savedTenant.id,
          isDeleted: false,
        },
      });

      if (existingCompany) {
        throw new BadRequestException(
          'Ya existe una empresa con este nombre en el tenant'
        );
      }

      const savedCompany = await prisma.company.create({
        data: {
          name: data.companyData.name,
          logo: data.companyData.logo,
          principal_color: data.companyData.principal_color,
          principal_color2: data.companyData.principal_color2,
          secondary_color: data.companyData.secondary_color,
          secondary_color2: data.companyData.secondary_color2,
          secondary_color3: data.companyData.secondary_color3,
          tenantId: savedTenant.id,
        },
      });

      // Step 6: Create user with tenant and company references (within transaction)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        data.userData.password,
        saltRounds
      );

      const savedUser = await prisma.user.create({
        data: {
          name: data.userData.name,
          email: data.userData.email,
          phone: data.userData.phone,
          password: hashedPassword,
          rut: data.userData.rut,
          public_name: data.userData.public_name,
          role: 'AUCTION_MANAGER', // Force AUCTION_MANAGER role
          tenantId: savedTenant.id,
          companyId: savedCompany.id,
        },
      });

      return {
        user: savedUser,
        company: savedCompany,
        tenant: savedTenant,
      };
    });
  }
}
