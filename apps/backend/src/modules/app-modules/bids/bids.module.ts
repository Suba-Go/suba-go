/**
 * @file bids.module.ts
 * @description Module for bid-related functionality
 * Handles real-time bid placement via WebSocket
 * @author Suba&Go
 */
import { Module } from '@nestjs/common';
import { BidPrismaService } from './services/bid-prisma.service';
import { BidRealtimeService } from './services/bid-realtime.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';
import { RealtimeModule } from '../../providers-modules/realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [],
  providers: [BidPrismaService, BidRealtimeService],
  exports: [BidPrismaService, BidRealtimeService],
})
export class BidsModule {}
