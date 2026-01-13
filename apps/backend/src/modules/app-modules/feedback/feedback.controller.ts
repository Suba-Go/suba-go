import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackCreatorService } from './services/feedback-creator.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FeedbackCreateDto } from '@suba-go/shared-validation';

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(
    private readonly feedbackCreatorService: FeedbackCreatorService
  ) {}

  /**
   * Create new feedback (AUCTION_MANAGER only)
   */
  @Post()
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  async createFeedback(
    @Body() feedbackData: FeedbackCreateDto,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    return await this.feedbackCreatorService.createFeedback(
      feedbackData,
      userId,
      tenantId
    );
  }

  /**
   * Get all feedback for the current user's tenant (AUCTION_MANAGER)
   */
  @Get()
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  async getFeedback(@Request() req: any) {
    const role = req.user.role;
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    // ADMIN can see all feedback from all tenants
    // AUCTION_MANAGER can see only their own feedback
    if (role === UserRolesEnum.ADMIN) {
      // For now, return all feedback for the tenant
      // In the future, you might want to return all feedback across all tenants
      return await this.feedbackCreatorService.getFeedbackByTenant(tenantId);
    }

    // AUCTION_MANAGER sees only their own feedback
    return await this.feedbackCreatorService.getFeedbackByUser(userId);
  }

  /**
   * Get feedback by category
   */
  @Get('category/:category')
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  async getFeedbackByCategory(
    @Param('category') category: string,
    @Request() req: any
  ) {
    const tenantId = req.user.tenantId;
    return await this.feedbackCreatorService.getFeedbackByCategory(
      tenantId,
      category
    );
  }

  /**
   * Get specific feedback by ID
   */
  @Get(':id')
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  async getFeedbackById(@Param('id') id: string) {
    return await this.feedbackCreatorService.getFeedbackById(id);
  }

  /**
   * Update feedback
   */
  @Patch(':id')
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  async updateFeedback(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req: any
  ) {
    const role = req.user.role;

    // ADMIN can update status
    if (role === UserRolesEnum.ADMIN && updateData.status) {
      return await this.feedbackCreatorService.updateFeedbackStatus(
        id,
        updateData.status
      );
    }

    // AUCTION_MANAGER can update content
    return await this.feedbackCreatorService.updateFeedback(id, updateData);
  }

  /**
   * Delete feedback
   */
  @Delete(':id')
  @Roles(UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.ADMIN)
  async deleteFeedback(@Param('id') id: string) {
    return await this.feedbackCreatorService.deleteFeedback(id);
  }
}
