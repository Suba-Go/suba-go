import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../modules/providers-modules/prisma/prisma.service';
import { Feedback } from '@prisma/client';

@Injectable()
export class FeedbackPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new feedback entry
   */
  async create(data: {
    category: string;
    title: string;
    message: string;
    userId: string;
    tenantId: string;
  }): Promise<Feedback> {
    return this.prisma.feedback.create({
      data: {
        category: data.category,
        title: data.title,
        message: data.message,
        user: {
          connect: {
            id: data.userId,
          },
        },
        tenant: {
          connect: {
            id: data.tenantId,
          },
        },
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find feedback by ID
   */
  async findById(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all feedback for a specific tenant
   */
  async findByTenant(tenantId: string): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find all feedback for a specific user
   */
  async findByUser(userId: string): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find feedback by category
   */
  async findByCategory(
    tenantId: string,
    category: string
  ): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        tenantId,
        category,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update feedback
   */
  async update(
    id: string,
    data: {
      category?: string;
      title?: string;
      message?: string;
      status?: 'PENDING' | 'REVIEWED' | 'RESOLVED';
    }
  ): Promise<Feedback> {
    return this.prisma.feedback.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete feedback
   */
  async delete(id: string): Promise<Feedback> {
    return this.prisma.feedback.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
