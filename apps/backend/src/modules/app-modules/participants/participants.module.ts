import { Module } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './services/participants.service';
import { ParticipantPrismaService } from './services/participant-prisma.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantPrismaService],
  exports: [ParticipantsService, ParticipantPrismaService],
})
export class ParticipantsModule {}
