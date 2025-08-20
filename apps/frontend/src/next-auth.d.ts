import { UserDto, Tokens } from '@suba-go/shared-validation';
import { DefaultSessions } from 'next-auth/next';

declare module 'next-auth' {
  interface Session extends DefaultSessions {
    user: UserDto & {
      emailVerified: Date | null;
    };
    tokens: Tokens;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: UserDto & {
      emailVerified: Date | null;
    };
    tokens: Tokens;
  }
}
