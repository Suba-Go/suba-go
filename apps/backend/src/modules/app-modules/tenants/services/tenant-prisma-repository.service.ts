import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { Tenant, Prisma } from '@prisma/client';

@Injectable()
export class TenantPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data,
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { domain },
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async findByName(name: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: {
        name,
        isDeleted: false,
      },
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        users: true,
        companies: true,
      },
    });
  }

  async softDelete(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Health check method
  async count(): Promise<number> {
    return this.prisma.tenant.count({
      where: {
        isDeleted: false,
      },
    });
  }
}
