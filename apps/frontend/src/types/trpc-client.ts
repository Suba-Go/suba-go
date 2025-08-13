/**
 * tRPC client type definitions for frontend
 * This provides type safety without importing from backend
 */

import type {
  UserCreateInput,
  CompanyCreateInput,
  TenantCreateInput,
  ConnectUserInput,
  MultiStepFormInput,
  ApiResponse,
  UserDto,
  CompanyDto,
  TenantDto,
} from '@suba-go/shared-validation';

// Define the structure of our tRPC router for type safety
export interface AppRouterClient {
  user: {
    create: {
      mutate: (input: UserCreateInput) => Promise<ApiResponse<UserDto>>;
    };
    connectToCompanyAndTenant: {
      mutate: (input: ConnectUserInput) => Promise<ApiResponse<UserDto>>;
    };
  };
  company: {
    create: {
      mutate: (input: CompanyCreateInput) => Promise<ApiResponse<CompanyDto>>;
    };
  };
  tenant: {
    create: {
      mutate: (input: TenantCreateInput) => Promise<ApiResponse<TenantDto>>;
    };
  };
  multiStepForm: {
    createComplete: {
      mutate: (input: MultiStepFormInput) => Promise<
        ApiResponse<{
          user: UserDto;
          company: CompanyDto;
          tenant: TenantDto;
        }>
      >;
    };
  };
}
