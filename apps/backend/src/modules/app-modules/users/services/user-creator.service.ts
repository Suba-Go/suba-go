import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { UserRoleEnum } from '@prisma/client';
import {
  UserCreateTrcpDto,
  UserWithTenantAndCompanyDto,
} from '@suba-go/shared-validation';
import { UserPrismaRepository } from './user-prisma-repository.service';
import { TenantPrismaRepository } from '../../tenants/services/tenant-prisma-repository.service';
import { CompanyPrismaRepository } from '../../companies/services/company-prisma-repository.service';

@Injectable()
export class UserCreatorService {
  constructor(
    private readonly userRepository: UserPrismaRepository,
    private readonly tenantRepository: TenantPrismaRepository,
    private readonly companyRepository: CompanyPrismaRepository
  ) {}

  async createUser(
    userData: UserCreateTrcpDto,
    tenantId?: string,
    companyId?: string
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }

    // Validate tenant exists if provided
    let tenant = null;
    if (tenantId) {
      tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new BadRequestException('El tenant especificado no existe');
      }
    }

    // Validate company exists if provided
    let company = null;
    if (companyId) {
      company = await this.companyRepository.findById(companyId);

      if (!company) {
        throw new BadRequestException('La empresa especificada no existe');
      }

      // If both tenant and company are provided, ensure they match
      if (tenant && company.tenant.id !== tenant.id) {
        throw new BadRequestException(
          'La empresa no pertenece al tenant especificado'
        );
      }

      // If only company is provided, use its tenant
      if (!tenant) {
        tenant = company.tenant;
      }
    }

    // Check if RUT already exists (if provided)
    if (userData.rut) {
      const existingUserByRut = await this.userRepository.findByRutAndTenant(
        userData.rut,
        tenant ? tenant.id : null
      );

      if (existingUserByRut) {
        throw new ConflictException('El usuario con este RUT ya existe');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Generate automatic public_name if user is being created within a company
    let publicName = userData.public_name;
    if (!publicName && company) {
      const nextUserNumber =
        await this.userRepository.getNextUserNumberForCompany(company.id);
      publicName = `Usuario ${nextUserNumber}`;
    }

    // Create user
    return await this.userRepository.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: hashedPassword,
      rut: userData.rut,
      public_name: publicName,
      role: (userData.role as UserRoleEnum) || UserRoleEnum.AUCTION_MANAGER,
      tenant: tenant ? { connect: { id: tenant.id } } : undefined,
      company: company ? { connect: { id: company.id } } : undefined,
    });
  }

  async connectUserToCompanyAndTenant(userData: UserWithTenantAndCompanyDto) {
    return await this.userRepository.connectUserToCompanyAndTenant(
      userData.id,
      userData.tenant.id,
      userData.company.id
    );
  }
}
