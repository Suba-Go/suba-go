/**
 * @file realtime.module.ts
 * @description Module for WebSocket realtime functionality
 * Uses AuctionsGateway for auction-specific real-time features
 * @author Suba&Go
 */
import { Module, forwardRef } from '@nestjs/common';
import { AuctionsGateway } from './auctions.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // Import AuthModule for JWT services
    forwardRef(() => require('../../app-modules/bids/bids.module').BidsModule), // Import BidsModule to access BidRealtimeService
  ],
  providers: [
    AuctionsGateway, // Auction-specific gateway with rooms and bid handling
  ],
  exports: [AuctionsGateway],
})
export class RealtimeModule {}
