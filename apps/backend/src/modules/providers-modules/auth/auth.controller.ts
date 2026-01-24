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
import type { User } from '@prisma/client';
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
  async signIn(
    @GetUser() user: User,
    @Request() req
  ): Promise<{ user: User; tokens: Tokens }> {
    if (!user || Object.keys(user).length === 0) {
      this.logger.log('User does not exist');
      throw new UnauthorizedException('User does not exist');
    }

    this.logger.verbose(`User ${user.email} attempting to sign in.`);
    const tokens: Tokens = await this.authService.signIn(user, {
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    this.logger.verbose(`User ${user.email} signed in.`);
    return { user, tokens };
  }

  @UseGuards(PublicGuard)
  @Post('/refresh')
  async refresh(@Request() req): Promise<Tokens> {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const tokens: Tokens = await this.authService.refreshTokens(refreshToken, {
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    this.logger.verbose(`User refreshed tokens.`);
    return tokens;
  }

  @UseGuards(PublicGuard)
  @Post('/logout')
  async logout(@Request() req): Promise<{ ok: true }> {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    await this.authService.logout(refreshToken);
    return { ok: true };
  }
}
