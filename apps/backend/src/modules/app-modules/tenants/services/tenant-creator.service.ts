import { Injectable, ConflictException } from '@nestjs/common';
import { TenantCreateDto } from '@suba-go/shared-validation';
import type { Tenant } from '@prisma/client';
import { TenantPrismaRepository } from './tenant-prisma-repository.service';

@Injectable()
export class TenantCreatorService {
  constructor(private readonly tenantRepository: TenantPrismaRepository) {}

  async createTenant(tenantData: TenantCreateDto): Promise<Tenant> {
    // Build domain based on environment
    const domain =
      process.env.NODE_ENV === 'development'
        ? `http://${tenantData.subdomain}.localhost:3000` // Development: subdomain.localhost:3000
        : `https://www.${tenantData.subdomain}.subago.cl`; // Production: www.subdomain.subago.cl
    // Check if tenant with same domain already exists
    const existingTenant = await this.tenantRepository.findByDomain(domain);

    if (existingTenant) {
      throw new ConflictException('Ya existe un tenant con este dominio');
    }

    // Check if tenant with same name already exists
    const existingTenantByName = await this.tenantRepository.findByName(
      tenantData.name
    );

    if (existingTenantByName) {
      throw new ConflictException('Ya existe un tenant con este nombre');
    }

    // Create tenant
    return await this.tenantRepository.create({
      name: tenantData.name,
      domain: domain,
    });
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    return await this.tenantRepository.findByDomain(domain);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return await this.tenantRepository.findById(id);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.findAll();
  }
}
