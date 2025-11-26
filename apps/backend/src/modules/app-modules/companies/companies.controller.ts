import { Controller, Post, Body, Param, Get, Patch, UseGuards } from '@nestjs/common';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
import { CompanyUpdaterService } from './services/company-updater.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CompanyCreateDto } from '@suba-go/shared-validation';
import { CompanyUpdateDto } from '@suba-go/shared-validation';

// Local enum definition to avoid import issues
enum UserRolesEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AUCTION_MANAGER = 'AUCTION_MANAGER',
}

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companyCreatorService: CompanyCreatorService,
    private readonly companyGetterService: CompanyGetterService,
    private readonly companyUpdaterService: CompanyUpdaterService
  ) {}

  @Post()
  async createCompanyStandalone(@Body() companyData: CompanyCreateDto) {
    return await this.companyCreatorService.createCompany(companyData);
  }

  @Post('tenant/:tenantId')
  async createCompany(
    @Body() companyData: CompanyCreateDto,
    @Param('tenantId') tenantId: string
  ) {
    return await this.companyCreatorService.createCompany(
      companyData,
      tenantId
    );
  }

  @Get('tenant/:tenantId')
  async getCompaniesByTenant(@Param('tenantId') tenantId: string) {
    return await this.companyCreatorService.getCompaniesByTenant(tenantId);
  }

  @Get(':id')
  async getCompanyById(@Param('id') id: string) {
    return await this.companyCreatorService.getCompanyById(id);
  }

  @Get('subdomain/:subdomain')
  async getCompanyBySubdomain(@Param('subdomain') subdomain: string) {
    return await this.companyGetterService.getCompanyBySubdomain(subdomain);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async updateCompany(
    @Param('id') id: string,
    @Body() updateData: CompanyUpdateDto
  ) {
    return await this.companyUpdaterService.updateCompany(id, updateData);
  }
}
