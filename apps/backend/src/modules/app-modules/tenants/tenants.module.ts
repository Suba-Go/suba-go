import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantsController } from './tenants.controller';
import { TenantCreatorService } from './services/tenant-creator.service';
import { TenantRepository } from './services/tenant-repository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  providers: [TenantCreatorService, TenantRepository],
  exports: [TenantCreatorService, TenantRepository],
})
export class TenantsModule {}
