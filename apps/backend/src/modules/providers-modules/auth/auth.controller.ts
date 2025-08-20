import {
  Controller,
  Logger,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ExtractJwt } from 'passport-jwt';
import { AuthService } from './services/auth.service';
import { User } from '@/modules/app-modules/users/user.entity';
import { Tokens } from '@suba-go/shared-validation';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { PublicGuard } from '@/common/guards/public.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signIn(@GetUser() user: User): Promise<{ user: User; tokens: Tokens }> {
    // If user does not exist, throw error
    if (!user || Object.keys(user).length === 0) {
      this.logger.log('User does not exist');
      throw new UnauthorizedException('User does not exist');
    }

    this.logger.verbose(`User ${user.email} attempting to sign in.`);
    const tokens: Tokens = await this.authService.signIn(user);
    this.logger.verbose(`User ${user.email} signed in.`);
    return { user, tokens };
  }

  @UseGuards(PublicGuard)
  @Post('/refresh')
  async refresh(@Request() req): Promise<Tokens> {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const tokens: Tokens = await this.authService.refreshTokens(refreshToken);
    this.logger.verbose(`User refreshed tokens.`);
    return tokens;
  }
}
