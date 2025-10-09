import {
  UserSafeWithCompanyAndTenantDto,
  Tokens,
} from '@suba-go/shared-validation';
import { DefaultSessions } from 'next-auth/next';

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
