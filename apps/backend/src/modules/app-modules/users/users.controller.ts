import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
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

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly userCreatorService: UserCreatorService,
    private readonly userGettersService: UserGettersService,
    private readonly userUpdaterService: UserUpdaterService
  ) {}

  @Post()
  async createUser(@Body() userData: UserCreateTrcpDto) {
    return await this.userCreatorService.createUser(userData);
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
    @Body() updateData: UserUpdateProfileDto,
    @Request() req: AuthenticatedRequest
  ) {
    // Los usuarios solo pueden actualizar su propio perfil
    if (req.user.role === UserRolesEnum.USER && req.user.userId !== id) {
      throw new Error('No puedes actualizar el perfil de otro usuario');
    }
    return await this.userUpdaterService.updateUserProfile(id, updateData);
  }

  @Get('company/:companyId')
  @UseGuards(RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async getUsersByCompany(@Param('companyId') companyId: string) {
    return await this.userGettersService.getUsersByCompany(companyId);
  }
}
