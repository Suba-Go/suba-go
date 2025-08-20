import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { Tenant } from '../tenants/tenant.entity';
import { CompaniesController } from './companies.controller';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
import { CompanyRepository } from './services/company-repository.service';
import { TenantRepository } from '../tenants/services/tenant-repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Tenant])],
  controllers: [CompaniesController],
  providers: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyRepository,
    TenantRepository,
  ],
  exports: [
    CompanyCreatorService,
    CompanyGetterService,
    CompanyRepository,
    TenantRepository,
  ],
})
export class CompaniesModule {}
