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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV !== 'test' ? '.env' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'suba_go',
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
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
