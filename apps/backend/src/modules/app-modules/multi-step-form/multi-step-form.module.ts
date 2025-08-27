import { Module } from '@nestjs/common';
import { MultiStepFormCreatorService } from './services/multi-step-form-creator.service';
import { UserPrismaRepository } from '../users/services/user-prisma-repository.service';
import { CompanyPrismaRepository } from '../companies/services/company-prisma-repository.service';
import { TenantPrismaRepository } from '../tenants/services/tenant-prisma-repository.service';

@Module({
  imports: [],
  providers: [
    MultiStepFormCreatorService,
    UserPrismaRepository,
    CompanyPrismaRepository,
    TenantPrismaRepository,
  ],
  exports: [MultiStepFormCreatorService],
})
export class MultiStepFormModule {}
