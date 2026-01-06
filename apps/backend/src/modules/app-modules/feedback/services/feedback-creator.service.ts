import { Injectable } from '@nestjs/common';
import { FeedbackPrismaRepository } from './feedback-prisma-repository.service';
import { FeedbackCreateDto } from '@suba-go/shared-validation';

@Injectable()
export class FeedbackCreatorService {
  constructor(
    private readonly feedbackRepository: FeedbackPrismaRepository
  ) {}

  /**
   * Create a new feedback entry
   */
  async createFeedback(
    data: FeedbackCreateDto,
    userId: string,
    tenantId: string
  ) {
    return this.feedbackRepository.create({
      category: data.category,
      title: data.title,
      message: data.message,
      userId,
      tenantId,
    });
  }

  /**
   * Get all feedback for a tenant
   */
  async getFeedbackByTenant(tenantId: string) {
    return this.feedbackRepository.findByTenant(tenantId);
  }

  /**
   * Get all feedback for a user
   */
  async getFeedbackByUser(userId: string) {
    return this.feedbackRepository.findByUser(userId);
  }

  /**
   * Get feedback by category
   */
  async getFeedbackByCategory(tenantId: string, category: string) {
    return this.feedbackRepository.findByCategory(tenantId, category);
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string) {
    return this.feedbackRepository.findById(id);
  }

  /**
   * Update feedback status (typically used by admins)
   */
  async updateFeedbackStatus(
    id: string,
    status: 'PENDING' | 'REVIEWED' | 'RESOLVED'
  ) {
    return this.feedbackRepository.update(id, { status });
  }

  /**
   * Update feedback content
   */
  async updateFeedback(
    id: string,
    data: {
      category?: string;
      title?: string;
      message?: string;
    }
  ) {
    return this.feedbackRepository.update(id, data);
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string) {
    return this.feedbackRepository.delete(id);
  }
}
