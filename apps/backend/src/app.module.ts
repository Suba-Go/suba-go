import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './modules/app-modules/users/user.entity';
import { Tenant } from './modules/app-modules/tenants/tenant.entity';
import { Company } from './modules/app-modules/companies/company.entity';
import { Auction } from './modules/app-modules/auctions/auction.entity';
import { AuctionItem } from './modules/app-modules/auction-items/auction_item.entity';
import { Item } from './modules/app-modules/items/item.entity';
import { Bid } from './modules/app-modules/bids/bids.entity';
import { AuditLog } from './modules/app-modules/audits-logs/audit-log.entity';
import { Observation } from './modules/app-modules/observations/observation.entity';
import { AuthModule } from './modules/providers-modules/auth/auth.module';
import { UsersModule } from './modules/app-modules/users/users.module';
import { CompaniesModule } from './modules/app-modules/companies/companies.module';
import { TenantsModule } from './modules/app-modules/tenants/tenants.module';
import { MultiStepFormModule } from './modules/app-modules/multi-step-form/multi-step-form.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV !== 'test' ? '.env' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DB_URL,
      entities: [
        User,
        Tenant,
        Company,
        Auction,
        AuctionItem,
        Item,
        Bid,
        AuditLog,
        Observation,
      ],
      synchronize: false,
      logging: true, // Enable logging to see connection details
      migrations: ['dist/apps/backend/src/database/migrations/*.js'],
      migrationsRun: false,
      ssl: { rejectUnauthorized: false }, // Force SSL for Supabase
      extra: {
        // Optimized for auction app - high concurrency and real-time features
        connectionTimeoutMillis: 10000, // Faster timeout for auctions
        idleTimeoutMillis: 60000, // Keep connections alive during auctions
        max: 50, // Higher pool size for concurrent bidders
        min: 5, // Maintain minimum connections
        acquireTimeoutMillis: 10000, // Quick connection acquisition
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000, // Frequent cleanup
      },
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    TenantsModule,
    MultiStepFormModule,
    TrpcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
