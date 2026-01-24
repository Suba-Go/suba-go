'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const NextAuthProvider = ({ children }: Props) => {
  // Keep the session fresh so NextAuth has a chance to rotate refresh tokens
  // and persist the new tokens back to the session cookie.
  // Without this, backend calls can start returning 401 once the access token expires.
  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
};

export default NextAuthProvider;
