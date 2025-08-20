import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouterClient } from '../types/trpc-client';
import superjson from 'superjson';

// tRPC client with type safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/trpc`,
      transformer: superjson,
    }),
  ],
}) as unknown as AppRouterClient;
