import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { TrpcController } from './trpc.controller';
import { UsersModule } from '../modules/app-modules/users/users.module';
import { CompaniesModule } from '../modules/app-modules/companies/companies.module';
import { TenantsModule } from '../modules/app-modules/tenants/tenants.module';
import { MultiStepFormModule } from '../modules/app-modules/multi-step-form/multi-step-form.module';

@Module({
  imports: [UsersModule, CompaniesModule, TenantsModule, MultiStepFormModule],
  controllers: [TrpcController],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
