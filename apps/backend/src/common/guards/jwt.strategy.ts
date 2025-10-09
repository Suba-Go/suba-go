import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@/modules/providers-modules/auth/services/auth.service';
import { JwtPayload } from '@suba-go/shared-validation';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.authService.validateJwtUser(payload.email);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
