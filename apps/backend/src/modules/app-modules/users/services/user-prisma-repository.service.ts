import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers-modules/prisma/prisma.service';
import type { User, Prisma } from '@prisma/client';

type UserWithCompanyAndTenant = Prisma.UserGetPayload<{
  include: {
    tenant: true;
    company: true;
  };
}>;

@Injectable()
export class UserPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findWithPasswordByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findByEmailWithRelations(
    email: string
  ): Promise<UserWithCompanyAndTenant | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        tenant: true,
      },
    });
  }

  async findByRut(rut: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { rut },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findByRutAndTenant(
    rut: string,
    tenantId: string | null
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        rut,
        tenantId,
      },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findByCompany(companyId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async connectUserToCompanyAndTenant(
    userId: string,
    tenantId: string,
    companyId: string
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        tenantId,
        companyId,
      },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  async findUserWithCompanyByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        company: true,
      },
    });
  }

  // Health check method
  async count(): Promise<number> {
    return this.prisma.user.count({
      where: {
        isDeleted: false,
      },
    });
  }

  // Get next user number for a specific company
  async getNextUserNumberForCompany(companyId: string): Promise<number> {
    const count = await this.prisma.user.count({
      where: {
        companyId,
        isDeleted: false,
      },
    });
    return count + 1;
  }

  async createInvitation(data: Prisma.InvitationCreateInput) {
    return this.prisma.invitation.create({
      data,
    });
  }

  async findInvitationByToken(token: string) {
    return this.prisma.invitation.findUnique({
      where: { token },
    });
  }

  async markInvitationAsUsed(id: string) {
    return this.prisma.invitation.update({
      where: { id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  async invalidatePendingInvitations(email: string) {
    return this.prisma.invitation.updateMany({
      where: {
        email,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });
  }
}
