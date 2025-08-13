import { Injectable, ConflictException } from '@nestjs/common';
import { TenantCreateDto } from '@suba-go/shared-validation';
import { Tenant } from '../tenant.entity';
import { TenantRepository } from './tenant-repository.service';

@Injectable()
export class TenantCreatorService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async createTenant(tenantData: TenantCreateDto): Promise<Tenant> {
    const domain = `https://${tenantData.subdomain}.subago.com`;
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
