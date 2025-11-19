import { Module } from '@nestjs/common';
import { AuctionItemsController } from './auction-items.controller';
import { AuctionItemsService } from './services/auction-items.service';
import { AuctionItemPrismaService } from './services/auction-item-prisma.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuctionItemsController],
  providers: [AuctionItemsService, AuctionItemPrismaService],
  exports: [AuctionItemsService, AuctionItemPrismaService],
})
export class AuctionItemsModule {}
