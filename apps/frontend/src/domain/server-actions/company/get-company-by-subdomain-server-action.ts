'use server';

import { fetcher } from '@/utils/wrappers/fetch-wrapper';
import { CompanyDto } from '@suba-go/shared-validation';

export const getCompanyBySubdomainServerAction = async (
  subdomain: string
): Promise<ApiResponse<CompanyDto>> => {
  try {
    const result = await fetcher(`/companies/subdomain/${subdomain}`, {
      method: 'GET',
      requireAuth: false,
      cache: 'no-store',
    });

    if (result.success) {
      return {
        success: true,
        data: result.data as CompanyDto,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Error al obtener datos de la empresa',
        statusCode: result.statusCode || 500,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      statusCode: 500,
    };
  }
};
