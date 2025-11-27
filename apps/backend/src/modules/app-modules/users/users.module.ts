import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
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
