import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserCreatorService } from './services/user-creator.service';
import { UserGettersService } from './services/user-getter.service';
import { UserUpdaterService } from './services/user-updater.service';
import { UserCompanyGetterService } from './services/user-company-getter.service';
import { UserPrismaRepository } from './services/user-prisma-repository.service';
import { UserLookupService } from './services/user-lookup.service';
import { UserLookupController } from './controllers/user-lookup.controller';
import { TenantPrismaRepository } from '../tenants/services/tenant-prisma-repository.service';
import { CompanyPrismaRepository } from '../companies/services/company-prisma-repository.service';

@Module({
  imports: [],
  controllers: [UsersController, UserLookupController],
  providers: [
    UserCreatorService,
    UserGettersService,
    UserUpdaterService,
    UserCompanyGetterService,
    UserLookupService,
    UserPrismaRepository,
    TenantPrismaRepository,
    CompanyPrismaRepository,
  ],
  exports: [
    UserCreatorService,
    UserGettersService,
    UserUpdaterService,
    UserCompanyGetterService,
    UserPrismaRepository,
    TenantPrismaRepository,
    CompanyPrismaRepository,
  ],
})
export class UsersModule {}
