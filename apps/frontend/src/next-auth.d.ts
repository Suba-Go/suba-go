import { UserSafeDto, Tokens } from '@suba-go/shared-validation';
import { DefaultSessions, Session } from 'next-auth/next';

declare module 'next-auth' {
  interface Session extends DefaultSessions {
    user: UserSafeDto & {
      emailVerified: Date | null;
    };
    tokens: Tokens;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: UserSafeDto & {
      emailVerified: Date | null;
    };
    tokens: Tokens;
  }
}

// Extend NextRequest to include auth property from NextAuth middleware
declare module 'next/server' {
  interface NextRequest {
    auth: Session | null;
  }
}
