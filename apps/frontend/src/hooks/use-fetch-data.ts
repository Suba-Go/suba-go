import { useFetchData as useFetchDataShared } from '@suba-go/shared-utils/functions/fetchData';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';

interface UseFetchDataOptions {
  url: string;
  key: (string | number)[];
  errorMessage?: string;
  condition?: boolean;
  fallbackData?: unknown;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  revalidateOnMount?: boolean;
  refreshInterval?: number;
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelayMs?: number;
  retryStatuses?: number[];
}

export function useFetchData<T>(options: UseFetchDataOptions) {
  const { toast } = useToast();
  const fetchFunction = async () => {
    const maxRetries = options.maxRetries ?? 0;
    const retryDelayMs = options.retryDelayMs ?? 250;
    const retryStatuses = new Set(options.retryStatuses ?? [401, 503]);

    let lastStatus: number | undefined;
    let lastBody: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // apiFetch will attempt a silent NextAuth refresh once if it receives a 401.
      // This prevents the UI from showing "Token inválido" errors when the access
      // token expires while the user is idle.
      const response = await apiFetch(options.url, {
        headers: options.headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
        };
      }

      lastStatus = response.status;
      try {
        lastBody = await response.text();
      } catch {
        lastBody = undefined;
      }

      // If after refresh+retry we still got 401, treat it as an auth boundary and
      // avoid spamming toasts during polling loops.
      if (response.status === 401) {
        return { success: false, error: 'UNAUTHORIZED' } as any;
      }

      const shouldRetry = retryStatuses.has(response.status) && attempt < maxRetries;
      if (!shouldRetry) break;

      // small backoff
      const delay = retryDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }

    const detail = lastBody ? ` - ${lastBody.slice(0, 200)}` : '';
    throw new Error(`HTTP error! status: ${lastStatus}${detail}`);
  };

  const toastWrapper = (toastOptions: unknown) => {
    const options = toastOptions as {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    };
    toast(options);
  };

  const result = useFetchDataShared<T>(
    options.key.join('-'),
    fetchFunction,
    toastWrapper,
    {
      errorMessage: options.errorMessage,
      condition: options.condition,
      fallbackData: options.fallbackData as T | undefined,
      revalidateOnFocus: options.revalidateOnFocus,
      revalidateOnReconnect: options.revalidateOnReconnect,
      dedupingInterval: options.dedupingInterval,
      revalidateOnMount: options.revalidateOnMount,
      refreshInterval: options.refreshInterval,
    }
  );

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: () => result.mutate(), // Force revalidation by calling mutate without arguments
  };
}
