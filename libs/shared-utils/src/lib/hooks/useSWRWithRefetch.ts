import useSWR from 'swr';
import { useEffect } from 'react';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export function useSWRWithRefetch<T = unknown>(
  path: string,
  serverAction: () => Promise<ApiResponse<T>>,
  refetchInterval: number
): {
  data: ApiResponse<T> | undefined;
  isLoading: boolean;
  mutate: (data?: ApiResponse<T>) => void;
  error: unknown;
} {
  const { data, isLoading, mutate, error } = useSWR(path, serverAction);

  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, refetchInterval);
    return () => clearInterval(interval);
  }, [path, mutate, refetchInterval]);

  return { data, isLoading, mutate, error };
}
