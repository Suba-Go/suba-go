import { UserGettersService } from '@/modules/app-modules/users/services/user-getter.service';
import type { User } from '@prisma/client';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload, RefreshPayload, Tokens } from '@suba-go/shared-validation';
import { SignInDto } from '@suba-go/shared-validation/lib/schemas/auth.schema';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userGettersService: UserGettersService
  ) {}

  async signIn(user: User): Promise<Tokens> {
    const payload: JwtPayload = { email: user.email, role: user.role };
    const accessToken = this.generateJwtToken(payload);
    const refreshToken = this.generateRefreshToken({ sub: user.id });
    const expiryTime = this.generateExpiryTime();

    return { accessToken, refreshToken, expiresIn: expiryTime };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // Verify the refresh token and decode its payload
      const decode: RefreshPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userGettersService.getUserById(decode.sub);
      if (!user) {
        throw new UnauthorizedException('Al parecer caducó tu sesión');
      }

      // Generate new tokens
      const newToken = this.generateJwtToken({
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = this.generateRefreshToken(decode);
      const expiryTime = this.generateExpiryTime();

      return {
        accessToken: newToken,
        refreshToken: newRefreshToken,
        expiresIn: expiryTime,
      };
    } catch (error) {
      this.logger.error('Error refreshing tokens:', error);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }
  }

  async validateLocalUser(signInDto: SignInDto): Promise<User> {
    const { email, password } = signInDto;
    this.logger.verbose(`Validating user with email: ${email}`);
    const user =
      await this.userGettersService.getUserWithPasswordAndRelationsByEmail(
        email
      );
    if (user && (await bcrypt.compare(password, user.password))) {
      this.logger.verbose('User validated successfully');
      return user;
    } else {
      this.logger.error('Invalid credentials');
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async validateJwtUser(email: string): Promise<User> {
    const user = await this.userGettersService.getUserWithPasswordByEmail(
      email
    );
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }

  private generateJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: RefreshPayload): string {
    return this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY_TIME'),
      }
    );
  }

  private generateExpiryTime(): number {
    return new Date().setTime(
      new Date().getTime() +
        this.configService.get('JWT_ACCESS_EXPIRY_TIME_INT') * 1000
    );
  }
}
