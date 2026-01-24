import { UserGettersService } from '@/modules/app-modules/users/services/user-getter.service';
import type { User } from '@prisma/client';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  JwtPayload,
  RefreshPayload,
  Tokens,
} from '@suba-go/shared-validation';
import { SignInDto } from '@suba-go/shared-validation/lib/schemas/auth.schema';
import { PrismaService } from '../../prisma/prisma.service';
import {
  computeExpiryDate,
  hashToken,
} from '../utils/refresh-token.utils';
import * as crypto from 'crypto';

type TokenContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userGettersService: UserGettersService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Issues a short-lived access token + a refresh token.
   *
   * Refresh tokens are stored server-side as a one-way hash to support rotation/revocation.
   */
  async signIn(user: User, ctx: TokenContext = {}): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
      companyId: user.companyId || undefined,
    };

    this.logger.verbose(`Creating JWT for user ${user.email} with payload:`, {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      companyId: payload.companyId,
    });

    const accessToken = this.generateJwtToken(payload);
    const expiryTime = this.generateAccessExpiryTime();

    const { refreshToken } = await this.issueAndStoreRefreshToken(user.id, ctx);

    return { accessToken, refreshToken, expiresIn: expiryTime };
  }

  /**
   * Rotates refresh tokens (old one is revoked, a new one is created).
   *
   * If the refresh token is invalid/revoked/expired -> Unauthorized.
   */
  async refreshTokens(refreshToken: string, ctx: TokenContext = {}): Promise<Tokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const hashSecret =
      this.configService.get<string>('JWT_REFRESH_HASH_SECRET') || refreshSecret;

    let decoded: RefreshPayload;
    try {
      decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch (error) {
      this.logger.warn('Invalid refresh token signature');
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    const tokenId = (decoded as any).jti as string | undefined;
    const userId = decoded.sub;

    if (!userId || !tokenId) {
      // Backward incompatible change: old refresh tokens (without jti) require re-login.
      this.logger.warn('Refresh token missing required fields (sub/jti)');
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    // Validate against DB record
    const tokenHash = hashToken(refreshToken, hashSecret);

    // We use `as any` to avoid TS mismatch before prisma generate runs after schema change.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenRecord = await (this.prisma as any).refreshToken.findUnique({
      where: { id: tokenId },
      select: {
        id: true,
        userId: true,
        hashedToken: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!tokenRecord) {
      this.logger.warn(`Refresh token not found (id=${tokenId})`);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    if (tokenRecord.userId !== userId) {
      this.logger.warn(`Refresh token user mismatch (id=${tokenId})`);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    if (tokenRecord.revokedAt) {
      this.logger.warn(`Refresh token already revoked (id=${tokenId})`);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    if (new Date(tokenRecord.expiresAt).getTime() <= Date.now()) {
      this.logger.warn(`Refresh token expired in DB (id=${tokenId})`);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    // Timing-safe hash compare
    if (!timingSafeEqualHex(tokenRecord.hashedToken, tokenHash)) {
      this.logger.warn(`Refresh token hash mismatch (id=${tokenId})`);
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    const user = await this.userGettersService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Al parecer caducó tu sesión');
    }

    // Tenant blocking: deny refresh when a tenant is blocked (except ADMIN)
    const tenant = (user as any).tenant;
    if (user.role !== 'ADMIN' && tenant?.isBlocked) {
      this.logger.warn(
        `Blocked tenant refresh denied for user ${user.email} (tenantId=${user.tenantId})`
      );
      throw new UnauthorizedException('Tenant bloqueado');
    }

    // Rotate: revoke current, create replacement
    const { refreshToken: newRefreshToken, refreshTokenId: newId } =
      await this.issueAndStoreRefreshToken(userId, ctx);

    await (this.prisma as any).refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: newId,
      },
    });

    const newAccessToken = this.generateJwtToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined,
      companyId: user.companyId || undefined,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.generateAccessExpiryTime(),
    };
  }

  /**
   * Revoke a refresh token (logout). Safe to call even if token is already revoked/unknown.
   */
  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const hashSecret =
      this.configService.get<string>('JWT_REFRESH_HASH_SECRET') || refreshSecret;

    let decoded: RefreshPayload | undefined;
    try {
      decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch {
      // Invalid token -> nothing to revoke
      return;
    }

    const tokenId = (decoded as any).jti as string | undefined;
    if (!tokenId) return;

    const tokenHash = hashToken(refreshToken, hashSecret);

    const record = await (this.prisma as any).refreshToken.findUnique({
      where: { id: tokenId },
      select: { id: true, revokedAt: true, hashedToken: true },
    });

    if (!record || record.revokedAt) return;

    if (!timingSafeEqualHex(record.hashedToken, tokenHash)) return;

    await (this.prisma as any).refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async validateLocalUser(signInDto: SignInDto): Promise<User> {
    const { email, password } = signInDto;
    this.logger.verbose(`Validating user with email: ${email}`);
    const user =
      await this.userGettersService.getUserWithPasswordAndRelationsByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      this.logger.verbose('User validated successfully');
      return user;
    } else {
      this.logger.error('Invalid credentials');
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async validateJwtUser(email: string): Promise<User> {
    const user = await this.userGettersService.getUserWithPasswordByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Tenant blocking: deny access when a tenant is blocked (except ADMIN)
    const tenant = (user as any).tenant;
    if (user.role !== 'ADMIN' && tenant?.isBlocked) {
      this.logger.warn(
        `Blocked tenant access denied for user ${user.email} (tenantId=${user.tenantId})`
      );
      throw new UnauthorizedException('Tenant bloqueado');
    }
    return user;
  }

  private generateJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private generateAccessExpiryTime(): number {
    return new Date().setTime(
      new Date().getTime() +
        this.configService.get('JWT_ACCESS_EXPIRY_TIME_INT') * 1000
    );
  }

  private async issueAndStoreRefreshToken(
    userId: string,
    ctx: TokenContext
  ): Promise<{ refreshToken: string; refreshTokenId: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const hashSecret =
      this.configService.get<string>('JWT_REFRESH_HASH_SECRET') || refreshSecret;
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY_TIME');

    // Use tokenId as JWT jti so we can validate/rotate.
    const refreshTokenId = crypto.randomUUID();

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: refreshTokenId } as any,
      {
        secret: refreshSecret,
        expiresIn: refreshExpiry,
      }
    );

    const expiresAt = computeExpiryDate(refreshExpiry);

    const tokenHash = hashToken(refreshToken, hashSecret);

    await (this.prisma as any).refreshToken.create({
      data: {
        id: refreshTokenId,
        userId,
        hashedToken: tokenHash,
        expiresAt,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
      },
    });

    return { refreshToken, refreshTokenId };
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
