import { Injectable, ConflictException } from '@nestjs/common';
import { CompanyPrismaRepository } from './company-prisma-repository.service';
import { CompanyUpdateDto } from '@suba-go/shared-validation';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class CompanyUpdaterService {
  constructor(private readonly companyRepository: CompanyPrismaRepository) {}

  async updateCompany(id: string, data: CompanyUpdateDto) {
    // Build update data, filtering out undefined values but keeping null/empty strings
    const updateData: any = {};

    // For each field, only add it if it's not undefined
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logo !== undefined) updateData.logo = data.logo || null;
    if (data.background_logo_enabled !== undefined)
      updateData.background_logo_enabled = data.background_logo_enabled;
    if (data.principal_color !== undefined)
      updateData.principal_color = data.principal_color || null;
    if (data.principal_color2 !== undefined)
      updateData.principal_color2 = data.principal_color2 || null;
    if (data.secondary_color !== undefined)
      updateData.secondary_color = data.secondary_color || null;
    if (data.secondary_color2 !== undefined)
      updateData.secondary_color2 = data.secondary_color2 || null;
    if (data.secondary_color3 !== undefined)
      updateData.secondary_color3 = data.secondary_color3 || null;

    try {
      return await this.companyRepository.update(id, updateData);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[];
        if (target?.includes('name')) {
          throw new ConflictException(
            'El nombre de la empresa ya está en uso. Por favor, elige otro.'
          );
        }
      }
      throw error;
    }
  }
}
