import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>
  ) {}

  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantsRepository.create(tenantData);
    return await this.tenantsRepository.save(tenant);
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return await this.tenantsRepository.findOne({
      where: { domain },
    });
  }

  async findByName(name: string): Promise<Tenant | null> {
    return await this.tenantsRepository.findOne({
      where: { name },
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return await this.tenantsRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantsRepository.find();
  }

  async update(
    id: string,
    updateData: Partial<Tenant>
  ): Promise<Tenant | null> {
    await this.tenantsRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.tenantsRepository.delete(id);
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.tenantsRepository.softDelete(id);
    return result.affected > 0;
  }
}
