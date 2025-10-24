import { Module } from '@nestjs/common';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './services/auctions.service';
import { AuctionPrismaService } from './services/auction-prisma.service';
import { AuctionStatusSchedulerService } from './services/auction-status-scheduler.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';
import { RealtimeModule } from '../../providers-modules/realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [AuctionsController],
  providers: [
    AuctionsService,
    AuctionPrismaService,
    AuctionStatusSchedulerService,
  ],
  exports: [AuctionsService, AuctionPrismaService],
})
export class AuctionsModule {}
