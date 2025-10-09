import { Module } from '@nestjs/common';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './services/auctions.service';
import { AuctionPrismaService } from './services/auction-prisma.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionPrismaService],
  exports: [AuctionsService, AuctionPrismaService],
})
export class AuctionsModule {}
