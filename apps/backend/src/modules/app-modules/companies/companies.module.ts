import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
import { CompanyPrismaRepository } from './services/company-prisma-repository.service';
import { TenantPrismaRepository } from '../tenants/services/tenant-prisma-repository.service';

@Module({
  imports: [],
  controllers: [CompaniesController],
  providers: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyPrismaRepository,
    TenantPrismaRepository,
  ],
  exports: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyPrismaRepository,
    TenantPrismaRepository,
  ],
})
export class CompaniesModule {}
