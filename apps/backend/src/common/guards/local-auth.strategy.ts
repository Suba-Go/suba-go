import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '@/modules/providers-modules/auth/services/auth.service';
import { SignInDto } from '@suba-go/shared-validation/lib/schemas/auth.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<unknown> {
    const signInDto: SignInDto = { email, password };
    try {
      const user = await this.authService.validateLocalUser(signInDto);
      return user;
    } catch (error) {
      // If the error is UnauthorizedException, return null to allow user creation
      // TODO: Don't catch this error after testing
      if (error instanceof UnauthorizedException) {
        return {};
      }
      throw error;
    }
  }
}
