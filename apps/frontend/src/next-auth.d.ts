import {
  UserSafeWithCompanyAndTenantDto,
  Tokens,
} from '@suba-go/shared-validation';
import { DefaultSessions, Session } from 'next-auth/next';

declare module 'next-auth' {
  interface Session extends DefaultSessions {
    user: UserSafeWithCompanyAndTenantDto & {
      emailVerified: Date | null;
    };
    tokens: Tokens;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: UserSafeWithCompanyAndTenantDto & {
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
