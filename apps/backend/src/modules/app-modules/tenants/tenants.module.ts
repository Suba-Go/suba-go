import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantCreatorService } from './services/tenant-creator.service';
import { TenantPrismaRepository } from './services/tenant-prisma-repository.service';

@Module({
  imports: [],
  controllers: [TenantsController],
  providers: [TenantCreatorService, TenantPrismaRepository],
  exports: [TenantCreatorService, TenantPrismaRepository],
})
export class TenantsModule {}
