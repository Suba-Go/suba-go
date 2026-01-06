import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CompaniesController } from './companies.controller';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
import { CompanyUpdaterService } from './services/company-updater.service';
import { CompanyPrismaRepository } from './services/company-prisma-repository.service';
import { TenantPrismaRepository } from '../tenants/services/tenant-prisma-repository.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CompaniesController],
  providers: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyUpdaterService,
    CompanyPrismaRepository,
    TenantPrismaRepository,
  ],
  exports: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyUpdaterService,
    CompanyPrismaRepository,
    TenantPrismaRepository,
  ],
})
export class CompaniesModule {}
