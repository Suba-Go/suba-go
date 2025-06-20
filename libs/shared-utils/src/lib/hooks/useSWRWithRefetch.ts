import useSWR from 'swr';
import { useEffect } from 'react';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export function useSWRWithRefetch(
  path: string,
  serverAction: () => Promise<ApiResponse<any>>,
  refetchInterval: number,
): {
  data: ApiResponse<any> | undefined;
  isLoading: boolean;
  mutate: (data: any) => void;
  error: any;
} {
  const { data, isLoading, mutate, error } = useSWR(path, serverAction);

  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, refetchInterval);
    return () => clearInterval(interval);
  }, [path]);

  return { data, isLoading, mutate, error };
}
