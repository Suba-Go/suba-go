import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackCreatorService } from './services/feedback-creator.service';
import { FeedbackPrismaRepository } from './services/feedback-prisma-repository.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController],
  providers: [FeedbackCreatorService, FeedbackPrismaRepository],
  exports: [FeedbackCreatorService, FeedbackPrismaRepository],
})
export class FeedbackModule {}
