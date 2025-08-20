import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Company } from '../companies/company.entity';
import { UsersController } from './users.controller';
import { UserCreatorService } from './services/user-creator.service';
import { UserGettersService } from './services/user-getter.service';
import { UserCompanyGetterService } from './services/user-company-getter.service';
import { UserRepository } from './services/user-repository.service';
import { UserLookupService } from './services/user-lookup.service';
import { UserLookupController } from './controllers/user-lookup.controller';
import { TenantRepository } from '../tenants/services/tenant-repository.service';
import { CompanyRepository } from '../companies/services/company-repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant, Company])],
  controllers: [UsersController, UserLookupController],
  providers: [
    UserCreatorService,
    UserGettersService,
    UserCompanyGetterService,
    UserLookupService,
    UserRepository,
    TenantRepository,
    CompanyRepository,
  ],
  exports: [
    UserCreatorService,
    UserGettersService,
    UserCompanyGetterService,
    UserRepository,
    TenantRepository,
    CompanyRepository,
  ],
})
export class UsersModule {}
