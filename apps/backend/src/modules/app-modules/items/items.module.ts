import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './services/items.service';
import { ItemPrismaRepository } from './services/item-prisma-repository.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemPrismaRepository],
  exports: [ItemsService, ItemPrismaRepository],
})
export class ItemsModule {}
