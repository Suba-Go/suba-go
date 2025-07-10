import 'server-only';
import superjson from 'superjson';
import { statusCodes } from '@/data/status-codes';
import { auth } from '@/auth';
import { AppError } from '../errors/app-errors';

type FetchOptions = {
  requireAuth?: boolean;
  body?: unknown;
  method?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
};

export const fetcher = async (
  url: string,
  options?: FetchOptions,
  customErrors?: string
): Promise<ApiResponse> => {
  try {
    const backend_url = process.env.BACKEND_URL;
    const requireAuth = options?.requireAuth !== false;

    let session;

    if (requireAuth) {
      session = await auth();
      if (!session) {
        const error =
          statusCodes[customErrors || 'default'][401] ||
          statusCodes['default'][401];
        return {
          success: false,
          error: error,
          statusCode: 401,
        };
      }
    }

    // Serialize the body if it exists
    let body;
    if (options?.body) {
      body = JSON.stringify({
        superjson: superjson.serialize(options.body),
      });
    }

    // Add query params
    if (options?.queryParams) {
      url += `?${new URLSearchParams(options.queryParams).toString()}`;
    }

    // Remove custom properties
    delete options?.requireAuth;
    delete options?.queryParams;

    let cacheOption;
    if (options?.cache) {
      cacheOption = options.cache;
    } else if (options?.next?.revalidate || options?.next?.tags) {
      cacheOption = undefined;
    } else {
      cacheOption = 'force-cache';
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        ...(requireAuth && {
          Authorization: `Bearer ${session?.tokens.accessToken}`,
        }),
      },
      body,
      cache: cacheOption as RequestCache,
    };

    const response = await fetch(`${backend_url}${url}`, fetchOptions);

    if (!response.ok) {
      // Handle 401 errors (token expired during API call)
      if (response.status === 401 && requireAuth) {
        // Let the SessionMonitor component handle the toast and redirect
        // This prevents duplicate notifications
        console.error('API call failed with 401 - token may be expired');
      }

      // Extract error details from response if available
      const errorMessage =
        statusCodes[customErrors || 'default'][response.status] ||
        statusCodes['default'][response.status];
      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      };
    }

    // Deserialize the response
    const responseData = await response.json();

    // Check if response has superjson structure
    let deserializedData;
    if (responseData && responseData.superjson) {
      try {
        deserializedData = superjson.deserialize(responseData.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson response:', error);
        deserializedData = responseData;
      }
    } else {
      // Response doesn't have superjson structure, use as is
      deserializedData = responseData;
    }

    return {
      success: true,
      data: deserializedData,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`Ha ocurrido un error inesperado: ${error}`, 500);
    }
  }
};
