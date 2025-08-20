import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { z } from 'zod';
import { UserCreatorService } from '../modules/app-modules/users/services/user-creator.service';
import { UserCompanyGetterService } from '../modules/app-modules/users/services/user-company-getter.service';
import { CompanyCreatorService } from '../modules/app-modules/companies/services/company-creator.service';
import { TenantCreatorService } from '../modules/app-modules/tenants/services/tenant-creator.service';
import { MultiStepFormCreatorService } from '../modules/app-modules/multi-step-form/services/multi-step-form-creator.service';
import {
  userCreateInputSchema,
  companyCreateInputSchema,
  tenantCreateInputSchema,
  connectUserInputSchema,
  multiStepFormInputSchema,
} from '@suba-go/shared-validation';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly userCreatorService: UserCreatorService,
    private readonly userCompanyGetterService: UserCompanyGetterService,
    private readonly companyCreatorService: CompanyCreatorService,
    private readonly tenantCreatorService: TenantCreatorService,
    private readonly multiStepFormCreatorService: MultiStepFormCreatorService
  ) {}

  appRouter = this.trpc.router({
    // User procedures
    user: this.trpc.router({
      create: this.trpc.procedure
        .input(userCreateInputSchema)
        .mutation(async ({ input }) => {
          try {
            const result = await this.userCreatorService.createUser(input);
            return {
              success: true,
              data: result,
              statusCode: 201,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 400,
            };
          }
        }),

      connectToCompanyAndTenant: this.trpc.procedure
        .input(connectUserInputSchema)
        .mutation(async ({ input }) => {
          try {
            const connectionData = {
              ...input.user,
              tenant: input.tenant,
              company: input.company,
            };
            const result =
              await this.userCreatorService.connectUserToCompanyAndTenant(
                connectionData
              );
            return {
              success: true,
              data: result,
              statusCode: 200,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 400,
            };
          }
        }),

      getCompanyDomain: this.trpc.procedure
        .input(z.object({ email: z.string().email() }))
        .query(async ({ input }) => {
          try {
            const domain =
              await this.userCompanyGetterService.getUserCompanyDomain(
                input.email
              );
            return {
              success: true,
              data: { domain },
              statusCode: 200,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 404,
            };
          }
        }),
    }),

    // Company procedures
    company: this.trpc.router({
      create: this.trpc.procedure
        .input(companyCreateInputSchema)
        .mutation(async ({ input }) => {
          try {
            const result = await this.companyCreatorService.createCompany(
              input
            );
            return {
              success: true,
              data: result,
              statusCode: 201,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 400,
            };
          }
        }),
    }),

    // Tenant procedures
    tenant: this.trpc.router({
      create: this.trpc.procedure
        .input(tenantCreateInputSchema)
        .mutation(async ({ input }) => {
          try {
            const result = await this.tenantCreatorService.createTenant(input);
            return {
              success: true,
              data: result,
              statusCode: 201,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 400,
            };
          }
        }),
    }),

    // Combined procedure for multi-step form
    multiStepForm: this.trpc.router({
      createComplete: this.trpc.procedure
        .input(multiStepFormInputSchema)
        .mutation(async ({ input }) => {
          try {
            // Use transactional service to ensure atomicity
            const result =
              await this.multiStepFormCreatorService.createCompleteAccount({
                userData: input.userData,
                companyData: input.companyData,
                tenantData: input.tenantData,
              });

            return {
              success: true,
              data: result,
              statusCode: 201,
            };
          } catch (error) {
            return {
              success: false,
              error: (error as Error).message,
              statusCode: 400,
            };
          }
        }),
    }),
  });
}

export type AppRouter = TrpcRouter['appRouter'];

// Export the router type for frontend consumption
export type { AppRouter as BackendAppRouter };
