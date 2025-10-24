/**
 * @file realtime.module.ts
 * @description Module for WebSocket realtime functionality
 * Includes both simple gateway and auction-specific gateway with rooms
 * @author Suba&Go
 */
import { Module, forwardRef } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { AuctionsGateway } from './auctions.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // Import AuthModule for JWT services
    forwardRef(() => require('../../app-modules/bids/bids.module').BidsModule), // Import BidsModule to access BidRealtimeService
  ],
  providers: [
    RealtimeGateway, // Simple WebSocket gateway with handshake (for testing)
    AuctionsGateway, // Auction-specific gateway with rooms and bid handling
  ],
  exports: [RealtimeGateway, AuctionsGateway],
})
export class RealtimeModule {}
