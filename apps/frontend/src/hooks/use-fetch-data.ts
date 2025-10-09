import { useFetchData as useFetchDataShared } from '@suba-go/shared-utils/functions/fetchData';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

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
}

export function useFetchData<T>(options: UseFetchDataOptions) {
  const { toast } = useToast();

  const fetchFunction = async () => {
    const response = await fetch(options.url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
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
    refetch: result.mutate,
  };
}
