import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { UserCreatorService } from './services/user-creator.service';
import { UserGettersService } from './services/user-getter.service';
import {
  UserCreateDto,
  UserSafeWithCompanyAndTenantDto,
} from '@suba-go/shared-validation';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userCreatorService: UserCreatorService,
    private readonly userGettersService: UserGettersService
  ) {}

  @Post()
  async createUser(@Body() userData: UserCreateDto) {
    return await this.userCreatorService.createUser(userData);
  }

  @Post('tenant/:tenantId')
  async createUserWithTenant(
    @Body() userData: UserCreateDto,
    @Param('tenantId') tenantId: string
  ) {
    return await this.userCreatorService.createUser(userData, tenantId);
  }

  @Post('tenant/:tenantId/company/:companyId')
  async createUserWithTenantAndCompany(
    @Body() userData: UserCreateDto,
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
  async getUserById(@Param('id') id: string) {
    return await this.userGettersService.getUserById(id);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return await this.userGettersService.findByEmail(email);
  }

  @Post('connect-user-to-company-and-tenant')
  async connectUserToCompanyAndTenant(
    @Body() userData: UserSafeWithCompanyAndTenantDto
  ) {
    return await this.userCreatorService.connectUserToCompanyAndTenant(
      userData
    );
  }
}
