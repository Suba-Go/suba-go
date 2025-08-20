import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { Tenant } from '../tenants/tenant.entity';
import { MultiStepFormCreatorService } from './services/multi-step-form-creator.service';
import { UserRepository } from '../users/services/user-repository.service';
import { CompanyRepository } from '../companies/services/company-repository.service';
import { TenantRepository } from '../tenants/services/tenant-repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company, Tenant])],
  providers: [
    MultiStepFormCreatorService,
    UserRepository,
    CompanyRepository,
    TenantRepository,
  ],
  exports: [MultiStepFormCreatorService],
})
export class MultiStepFormModule {}
