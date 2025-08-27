import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { UserGettersService } from '@/modules/app-modules/users/services/user-getter.service';
import { UserPrismaRepository } from '@/modules/app-modules/users/services/user-prisma-repository.service';
import { LocalStrategy } from '@/common/guards/local-auth.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserGettersService,
    UserPrismaRepository,
    LocalStrategy,
  ],
  exports: [AuthService, UserGettersService],
})
export class AuthModule {}
