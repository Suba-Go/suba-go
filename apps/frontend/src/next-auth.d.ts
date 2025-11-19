import { Tokens, UserWithTenantAndCompanyDto } from '@suba-go/shared-validation';
import { DefaultSessions, Session } from 'next-auth/next';

declare module 'next-auth' {
  interface Session extends DefaultSessions {
    user: UserWithTenantAndCompanyDto;
    tokens: Tokens;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: UserWithTenantAndCompanyDto;
    tokens: Tokens;
  }
}

// Extend NextRequest to include auth property from NextAuth middleware
declare module 'next/server' {
  interface NextRequest {
    auth: Session | null;
  }
}
