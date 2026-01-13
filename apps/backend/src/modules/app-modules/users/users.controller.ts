import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRoleEnum } from '@prisma/client';
import { UserCreatorService } from './services/user-creator.service';
import { UserGettersService } from './services/user-getter.service';
import { UserUpdaterService } from './services/user-updater.service';
import {
  UserCreateTrcpDto,
  UserUpdateProfileDto,
  UserWithTenantAndCompanyDto,
} from '@suba-go/shared-validation';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserPrismaRepository } from './services/user-prisma-repository.service';
import { AuthenticatedRequest } from '@/common/types/auth.types';
import { Public } from '@/common/decorators/public.decorator';

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly userCreatorService: UserCreatorService,
    private readonly userGettersService: UserGettersService,
    private readonly userUpdaterService: UserUpdaterService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserPrismaRepository
  ) {}

  @Post()
  async createUser(@Body() userData: UserCreateTrcpDto) {
    return await this.userCreatorService.createUser(userData);
  }

  @Post('invite')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  async createInvite(
    @Body() body: { email: string; role?: UserRolesEnum },
    @Request() req: AuthenticatedRequest
  ) {
    const { email, role } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email inválido');
    }

    if (!req.user || !req.user.userId) {
      throw new Error('Usuario no autenticado o ID de usuario no disponible');
    }

    const currentUser = await this.userGettersService.getUserById(
      req.user.userId
    );
    if (!currentUser) {
      throw new Error('Usuario actual no encontrado');
    }

    // 100 years expiration (effectively never expires)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 36500);

    // Invalidate previous pending invitations for this email
    await this.userRepository.invalidatePendingInvitations(email);

    // Create unique token
    const token = this.jwtService.sign(
      {
        email,
        role: role || UserRolesEnum.USER,
        tenantId: req.user.tenantId,
        companyId: currentUser.companyId,
        timestamp: Date.now(),
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '36500d',
      }
    );

    // Store invitation in DB
    await this.userRepository.createInvitation({
      email,
      token,
      expiresAt: expiryDate,
      role: role || UserRolesEnum.USER,
      invitedByUser: { connect: { id: req.user.userId } },
      tenant: req.user.tenantId
        ? { connect: { id: req.user.tenantId } }
        : undefined,
      company: currentUser.companyId
        ? { connect: { id: currentUser.companyId } }
        : undefined,
    });

    const response = { token, expiresAt: expiryDate.toISOString() };
    return response;
  }

  @Post('invite/direct-create')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.AUCTION_MANAGER)
  async directCreateInvite(
    @Body() body: { email: string; role?: UserRolesEnum },
    @Request() req: AuthenticatedRequest
  ) {
    const { email, role } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email inválido');
    }

    const existing = await this.userGettersService.findByEmail(email);
    if (existing) {
      throw new Error('El usuario ya existe');
    }

    const manager = await this.userGettersService.getUserById(req.user.userId);
    const tempPassword = Math.random().toString(36).slice(-10) + '!A1';
    const hashed = await bcrypt.hash(tempPassword, 10);

    const created = await this.userRepository.create({
      email,
      password: hashed,
      role: role || UserRolesEnum.USER,
      tenant: manager.tenantId
        ? { connect: { id: manager.tenantId } }
        : undefined,
      company: manager.companyId
        ? { connect: { id: manager.companyId } }
        : undefined,
    } as any);

    const expires =
      this.configService.get<string>('INVITE_EXPIRY_TIME') || '36500d';
    const token = this.jwtService.sign(
      {
        email,
        role: role || UserRolesEnum.USER,
        tenantId: manager.tenantId,
        companyId: manager.companyId,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: expires,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safe } = created as any;
    return { user: safe, token };
  }

  @Public()
  @Get('invite/verify')
  async verifyInvite(@Query('token') token: string) {
    try {
      // 1. Verify JWT signature first
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 2. Check if invitation exists in DB and is valid
      const invitation = await this.userRepository.findInvitationByToken(token);

      if (!invitation) {
        return { valid: false, error: 'Invitación no encontrada' };
      }

      if (invitation.isUsed) {
        return { valid: false, error: 'Esta invitación ya fue utilizada' };
      }

      if (new Date() > invitation.expiresAt) {
        return { valid: false, error: 'La invitación ha expirado' };
      }

      return {
        valid: true,
        data: {
          email: invitation.email,
          tenantId: invitation.tenantId,
          companyId: invitation.companyId,
          role: invitation.role,
          exp: Math.floor(invitation.expiresAt.getTime() / 1000),
        },
      };
    } catch (error) {
      return { valid: false, error: 'Token inválido o expirado' };
    }
  }

  @Public()
  @Post('invite/accept')
  async acceptInvite(@Body() body: { token: string; password: string }) {
    const { token, password } = body;
    if (!token || !password || password.length < 8) {
      throw new Error('Datos inválidos');
    }

    // Verify token exists and is valid
    const invitation = await this.userRepository.findInvitationByToken(token);
    if (!invitation || invitation.isUsed || new Date() > invitation.expiresAt) {
      throw new Error('Invitación inválida o expirada');
    }

    try {
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new Error('Token inválido');
    }

    const { email, tenantId, companyId, role } = invitation;

    const existing = await this.userGettersService.findByEmail(email);
    const hashed = await bcrypt.hash(password, 10);

    let resultUser;

    if (existing) {
      // Update password and attach relations only if missing
      const updateData: any = {
        password: hashed,
        role: (existing.role as any) || (role as any) || UserRoleEnum.USER,
      };
      if (tenantId && !existing.tenantId) {
        updateData.tenant = { connect: { id: tenantId } };
      }
      if (companyId && !existing.companyId) {
        updateData.company = { connect: { id: companyId } };
      }

      resultUser = await this.userRepository.update(existing.id, updateData);
    } else {
      // Generate automatic public_name
      let publicName = `Usuario`;
      if (companyId) {
        const nextUserNumber =
          await this.userRepository.getNextUserNumberForCompany(companyId);
        publicName = `Usuario ${nextUserNumber}`;
      }

      resultUser = await this.userRepository.create({
        email,
        password: hashed,
        public_name: publicName,
        role: role || UserRolesEnum.USER,
        tenant: tenantId ? { connect: { id: tenantId } } : undefined,
        company: companyId ? { connect: { id: companyId } } : undefined,
      } as any);
    }

    // Mark invitation as used
    await this.userRepository.markInvitationAsUsed(invitation.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safe } = resultUser as any;
    return { success: true, user: safe };
  }

  @Post('tenant/:tenantId')
  async createUserWithTenant(
    @Body() userData: UserCreateTrcpDto,
    @Param('tenantId') tenantId: string
  ) {
    return await this.userCreatorService.createUser(userData, tenantId);
  }

  @Post('tenant/:tenantId/company/:companyId')
  async createUserWithTenantAndCompany(
    @Body() userData: UserCreateTrcpDto,
    @Param('tenantId') tenantId: string,
    @Param('companyId') companyId: string
  ) {
    return await this.userCreatorService.createUser(
      userData,
      tenantId,
      companyId
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async getUserById(@Param('id') id: string) {
    return await this.userGettersService.getUserById(id);
  }

  @Get('email/:email')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async getUserByEmail(@Param('email') email: string) {
    return await this.userGettersService.findByEmail(email);
  }

  @Post('connect-user-to-company-and-tenant')
  async connectUserToCompanyAndTenant(
    @Body() userData: UserWithTenantAndCompanyDto
  ) {
    return await this.userCreatorService.connectUserToCompanyAndTenant(
      userData
    );
  }

  @Patch(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER, UserRolesEnum.USER)
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateData: UserUpdateProfileDto
  ) {
    return await this.userUpdaterService.updateUserProfile(id, updateData);
  }

  @Get('company/:companyId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async getUsersByCompany(@Param('companyId') companyId: string) {
    return await this.userGettersService.getUsersByCompany(companyId);
  }

  @Post(':id/delete')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async deleteUser(@Param('id') id: string) {
    return await this.userRepository.softDelete(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async deleteUserRest(@Param('id') id: string) {
    return await this.userRepository.softDelete(id);
  }
}
