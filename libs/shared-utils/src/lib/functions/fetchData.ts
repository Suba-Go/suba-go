/**
 * Type definition for API responses
 * @template T - The type of data expected in the response
 */
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

import useSWR from 'swr';

/**
 * Handles API responses and error display
 * @template T - The type of data expected in the response
 * @param key - Unique identifier for the request
 * @param fetchFunction - Function that returns a promise with the API response
 * @param toast - Function to display toast notifications
 * @param errorMessage - Optional custom error message
 * @returns Promise with the data if successful
 * @throws Error if the request fails
 */
export const fetchData = async <T>(
  key: string,
  fetchFunction: () => Promise<ApiResponse<T>>,
  toast: (options: any) => void,
  errorMessage?: string,
): Promise<T> => {
  const response = await fetchFunction();
  if (response.success && response.data !== undefined) {
    return response.data;
  } else {
    console.error('Error fetching data for key:', key);
    console.error('Response:', response);
    toast({
      title: errorMessage || 'Error al comunicar con el servidor',
      description: response.error,
      variant: 'destructive',
    });
    console.error(`Error fetching data for key: ${key}`, response.error);
    throw new Error(response.error);
  }
};

/**
 * Custom hook that combines useSWR with fetchData for simplified data fetching
 * Supports conditional fetching based on a condition parameter
 * @template T - The type of data expected in the response
 * @param key - Unique identifier for the request
 * @param fetchFunction - Function that returns a promise with the API response
 * @param toast - Function to display toast notifications
 * @param options - Optional configuration object
 * @param options.errorMessage - Custom error message
 * @param options.condition - Condition to determine if the request should be made
 * @param options.fallbackData - Initial data to use while loading
 * @param options.revalidateOnFocus - Whether to revalidate on window focus
 * @param options.revalidateOnReconnect - Whether to revalidate on network reconnection
 * @param options.dedupingInterval - Time in milliseconds to dedupe requests
 * @param options.revalidateOnMount - Whether to revalidate on component mount
 * @param options.refreshInterval - Time in seconds between automatic revalidations
 * @returns SWR response object with data and loading state
 */
export const useFetchData = <T>(
  key: string | null,
  fetchFunction: (() => Promise<ApiResponse<T>>) | null,
  toast: (options: any) => void,
  options?: {
    errorMessage?: string;
    condition?: boolean | string | null;
    fallbackData?: T;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
    revalidateOnMount?: boolean;
    refreshInterval?: number;
  },
) => {
  // If condition is explicitly provided, use it, otherwise check if key and fetchFunction exist
  const shouldFetch =
    options?.condition !== undefined
      ? !!options.condition
      : !!(key && fetchFunction);

  // Only fetch if shouldFetch is true
  return useSWR<T>(
    shouldFetch ? key : null,
    shouldFetch && key && fetchFunction
      ? () => fetchData(key, fetchFunction, toast, options?.errorMessage)
      : null,
    {
      fallbackData: options?.fallbackData,
      revalidateOnFocus: options?.revalidateOnFocus,
      revalidateOnReconnect: options?.revalidateOnReconnect,
      revalidateOnMount: options?.revalidateOnMount,
      dedupingInterval: options?.dedupingInterval,
      refreshInterval: options?.refreshInterval
        ? options.refreshInterval * 1000
        : undefined,
    },
  );
};
