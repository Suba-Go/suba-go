import { Injectable } from '@nestjs/common';
import { CompanyPrismaRepository } from './company-prisma-repository.service';
import { CompanyUpdateDto } from '@suba-go/shared-validation';

@Injectable()
export class CompanyUpdaterService {
  constructor(private readonly companyRepository: CompanyPrismaRepository) {}

  async updateCompany(id: string, data: CompanyUpdateDto) {
    // Build update data, filtering out undefined values but keeping null/empty strings
    const updateData: any = {};
    
    // For each field, only add it if it's not undefined
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || null;
    if (data.logo !== undefined) updateData.logo = data.logo || null;
    if (data.background_logo_enabled !== undefined) updateData.background_logo_enabled = data.background_logo_enabled;
    if (data.principal_color !== undefined) updateData.principal_color = data.principal_color || null;
    if (data.principal_color2 !== undefined) updateData.principal_color2 = data.principal_color2 || null;
    if (data.secondary_color !== undefined) updateData.secondary_color = data.secondary_color || null;
    if (data.secondary_color2 !== undefined) updateData.secondary_color2 = data.secondary_color2 || null;
    if (data.secondary_color3 !== undefined) updateData.secondary_color3 = data.secondary_color3 || null;
    if ((data as any).rut !== undefined) updateData.rut = (data as any).rut || null;

    return this.companyRepository.update(id, updateData);
  }
}