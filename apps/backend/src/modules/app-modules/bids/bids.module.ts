import { Module, forwardRef } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidsService } from './services/bids.service';
import { BidPrismaService } from './services/bid-prisma.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WebSocketModule)],
  controllers: [BidsController],
  providers: [BidsService, BidPrismaService],
  exports: [BidsService, BidPrismaService],
})
export class BidsModule {}
