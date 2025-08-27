import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/providers-modules/prisma/prisma.module';

import { AuthModule } from './modules/providers-modules/auth/auth.module';
import { UsersModule } from './modules/app-modules/users/users.module';
import { CompaniesModule } from './modules/app-modules/companies/companies.module';
import { TenantsModule } from './modules/app-modules/tenants/tenants.module';
import { MultiStepFormModule } from './modules/app-modules/multi-step-form/multi-step-form.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV !== 'test' ? '.env' : '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    TenantsModule,
    MultiStepFormModule,
    TrpcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
