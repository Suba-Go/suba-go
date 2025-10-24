import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Company, Prisma } from '@prisma/client';
import { normalizeCompanyName } from '../../../../utils/company-normalization';

@Injectable()
export class CompanyPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({
      data,
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async findByTenant(tenantId: string): Promise<Company[]> {
    return this.prisma.company.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async findByName(name: string): Promise<Company | null> {
    // Case-insensitive search using normalized company name
    return this.prisma.company.findFirst({
      where: {
        nameLowercase: normalizeCompanyName(name),
        isDeleted: false,
      },
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async findByNameAndTenant(
    name: string,
    tenantId: string
  ): Promise<Company | null> {
    // Case-insensitive search using normalized company name
    return this.prisma.company.findFirst({
      where: {
        nameLowercase: normalizeCompanyName(name),
        tenantId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.prisma.company.update({
      where: { id },
      data,
      include: {
        tenant: true,
        users: true,
      },
    });
  }

  async softDelete(id: string): Promise<Company> {
    return this.prisma.company.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Health check method
  async count(): Promise<number> {
    return this.prisma.company.count({
      where: {
        isDeleted: false,
      },
    });
  }
}
