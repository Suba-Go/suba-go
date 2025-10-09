import { Module } from '@nestjs/common';
import { AuctionWebSocketGateway } from './gateways/auction-websocket.gateway';
import { WebSocketService } from './services/websocket.service';
import { PrismaModule } from '../../providers-modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuctionWebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
