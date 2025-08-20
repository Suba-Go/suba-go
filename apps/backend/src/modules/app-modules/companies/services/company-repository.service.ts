import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../company.entity';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>
  ) {}

  async create(companyData: Partial<Company>): Promise<Company> {
    const company = this.companiesRepository.create(companyData);
    return await this.companiesRepository.save(company);
  }

  async findById(id: string): Promise<Company | null> {
    return await this.companiesRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['tenant'],
    });
  }

  async findByNameAndTenant(
    name: string,
    tenantId: string
  ): Promise<Company | null> {
    return await this.companiesRepository.findOne({
      where: {
        name,
        tenant: { id: tenantId },
        isDeleted: false,
      },
      relations: ['tenant'],
    });
  }

  async findByTenant(tenantId: string): Promise<Company[]> {
    return await this.companiesRepository.find({
      where: {
        tenant: { id: tenantId },
        isDeleted: false,
      },
      relations: ['tenant'],
    });
  }

  async findAll(): Promise<Company[]> {
    return await this.companiesRepository.find({
      where: { isDeleted: false },
      relations: ['tenant'],
    });
  }

  async update(
    id: string,
    updateData: Partial<Company>
  ): Promise<Company | null> {
    await this.companiesRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.companiesRepository.delete(id);
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.companiesRepository.update(id, {
      isDeleted: true,
    });
    return result.affected > 0;
  }
}
