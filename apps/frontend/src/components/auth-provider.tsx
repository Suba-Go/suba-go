'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { SessionKeeper } from './session-keeper';

interface Props {
  children: ReactNode;
}

const NextAuthProvider = ({ children }: Props) => {
  // Keep the session fresh so NextAuth has a chance to rotate refresh tokens
  // and persist the new tokens back to the session cookie.
  // Without this, backend calls can start returning 401 once the access token expires.
  return (
    <SessionProvider
      // Refetch a bit more often so the jwt callback can refresh the access token
      // before it expires (important for long-lived pages like live auctions).
      refetchInterval={30}
      refetchOnWindowFocus
    >
      <SessionKeeper />
      {children}
    </SessionProvider>
  );
};

export default NextAuthProvider;
