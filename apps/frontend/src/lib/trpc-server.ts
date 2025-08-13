import 'server-only';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouterClient } from '../types/trpc-client';
import superjson from 'superjson';

// Server-side tRPC client for server actions with type safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpcServer = createTRPCClient<any>({
  links: [
    httpBatchLink({
      url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/trpc`,
      transformer: superjson,
    }),
  ],
}) as unknown as AppRouterClient;
