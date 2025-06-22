import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './modules/user/user.entity';
import { Tenant } from './modules/tenant/tenant.entity';
import { Company } from './modules/company/company.entity';
import { Auction } from './modules/auction/auction.entity';
import { AuctionItem } from './modules/auction-item/auction_item.entity';
import { Item } from './modules/item/item.entity';
import { Bid } from './modules/bid/bid.entity';
import { AuditLog } from './modules/audit-log/audit-log.entity';
import { Observation } from './modules/observation/observation.entity';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
