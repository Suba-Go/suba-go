import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/providers-modules/prisma/prisma.module';

import { AuthModule } from './modules/providers-modules/auth/auth.module';
import { UsersModule } from './modules/app-modules/users/users.module';
import { CompaniesModule } from './modules/app-modules/companies/companies.module';
import { TenantsModule } from './modules/app-modules/tenants/tenants.module';
import { AuctionsModule } from './modules/app-modules/auctions/auctions.module';
import { AuctionItemsModule } from './modules/app-modules/auction-items/auction-items.module';
import { ItemsModule } from './modules/app-modules/items/items.module';
import { ParticipantsModule } from './modules/app-modules/participants/participants.module';
import { BidsModule } from './modules/app-modules/bids/bids.module';
import { MultiStepFormModule } from './modules/app-modules/multi-step-form/multi-step-form.module';
import { TrpcModule } from './trpc/trpc.module';
import { RealtimeModule } from './modules/providers-modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    TenantsModule,
    AuctionsModule,
    AuctionItemsModule,
    ItemsModule,
    ParticipantsModule,
    BidsModule,
    MultiStepFormModule,
    TrpcModule,
    RealtimeModule, // Native WebSocket with double handshake
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
