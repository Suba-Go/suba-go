import { Injectable, BadRequestException } from '@nestjs/common';
import {
  UserCreateDto,
  CompanyCreateCompactDto,
} from '@suba-go/shared-validation';
import {
  type User,
  type Company,
  type Tenant,
  type Prisma,
  UserRoleEnum,
} from '@prisma/client';
import { UserPrismaRepository } from '../../users/services/user-prisma-repository.service';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import { normalizeCompanyName } from '../../../../utils/company-normalization';
import * as bcrypt from 'bcrypt';

type CompanyCreateInputWithNormalized = Prisma.CompanyCreateInput & {
  nameLowercase: string;
};

export interface MultiStepFormData {
  userData: UserCreateDto;
  companyData: CompanyCreateCompactDto;
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
    private readonly userRepository: UserPrismaRepository
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
      const savedTenant = await prisma.tenant.create({
        data: {},
      });

      // Step 4: Create company with tenant reference (within transaction)
      // Check if company with same name already exists globally (company name is unique)
      const existingCompany = await prisma.company.findFirst({
        where: {
          name: data.companyData.name,
          isDeleted: false,
        },
      });

      if (existingCompany) {
        throw new BadRequestException(
          'Ya existe una empresa con este nombre (el nombre de la empresa es el subdominio)'
        );
      }

      const savedCompany = await prisma.company.create({
        data: {
          name: data.companyData.name,
          nameLowercase: normalizeCompanyName(data.companyData.name),
          logo: null,
          principal_color: data.companyData.principal_color,
          principal_color2: null,
          secondary_color: null,
          secondary_color2: null,
          secondary_color3: null,
          tenant: { connect: { id: savedTenant.id } },
        } as CompanyCreateInputWithNormalized,
      });

      // Step 5: Create user with tenant and company references (within transaction)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        data.userData.password,
        saltRounds
      );

      // Generate automatic public_name for the first user of the company
      const userCount = await prisma.user.count({
        where: {
          companyId: savedCompany.id,
          isDeleted: false,
        },
      });
      const publicName =
        data.userData.public_name || `Usuario ${userCount + 1}`;

      const savedUser = await prisma.user.create({
        data: {
          name: data.userData.name,
          email: data.userData.email,
          phone: data.userData.phone,
          password: hashedPassword,
          rut: data.userData.rut,
          public_name: publicName,
          role: UserRoleEnum.AUCTION_MANAGER, // Force AUCTION_MANAGER role
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
