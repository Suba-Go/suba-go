import { Injectable, ConflictException } from '@nestjs/common';
import { TenantCreateDto } from '@suba-go/shared-validation';
import type { Tenant } from '@prisma/client';
import { TenantPrismaRepository } from './tenant-prisma-repository.service';

@Injectable()
export class TenantCreatorService {
  constructor(private readonly tenantRepository: TenantPrismaRepository) {}

  async createTenant(tenantData: TenantCreateDto): Promise<Tenant> {
    // Tenant no longer has a name field - just create it
    // Company name will be used as subdomain identifier
    return await this.tenantRepository.create({});
  }

  // Removed getTenantByName - tenant no longer has a name field
  // Use company name to find tenant through company relationship

  async getTenantById(id: string): Promise<Tenant | null> {
    return await this.tenantRepository.findById(id);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.findAll();
  }
}
