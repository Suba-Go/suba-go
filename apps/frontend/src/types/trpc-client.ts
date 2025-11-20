/**
 * tRPC client type definitions for frontend
 * This provides type safety without importing from backend
 */

import type {
  MultiStepFormInput,
  ApiResponse,
  UserDto,
  CompanyDto,
  TenantDto,
  UserSafeDto,
  UserCreateDto,
  CompanyCreateCompactDto,
  TenantCreateDto,
  UserWithTenantAndCompanyDto,
} from '@suba-go/shared-validation';

// Define the structure of our tRPC router for type safety
export interface AppRouterClient {
  user: {
    create: {
      mutate: (input: UserCreateDto) => Promise<ApiResponse<UserSafeDto>>;
    };
    connectToCompanyAndTenant: {
      mutate: (
        input: UserWithTenantAndCompanyDto
      ) => Promise<ApiResponse<UserDto>>;
    };
    getCompanyDomain: {
      query: (input: {
        email: string;
      }) => Promise<ApiResponse<{ domain: string }>>;
    };
  };
  company: {
    create: {
      mutate: (
        input: CompanyCreateCompactDto
      ) => Promise<ApiResponse<CompanyDto>>;
    };
  };
  tenant: {
    create: {
      mutate: (input: TenantCreateDto) => Promise<ApiResponse<TenantDto>>;
    };
  };
  multiStepForm: {
    createComplete: {
      mutate: (input: MultiStepFormInput) => Promise<
        ApiResponse<{
          user: UserDto;
          company: CompanyDto;
        }>
      >;
    };
  };
}
