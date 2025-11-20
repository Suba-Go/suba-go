import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
import { CompanyCreateCompactDto } from '@suba-go/shared-validation';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companyCreatorService: CompanyCreatorService,
    private readonly companyGetterService: CompanyGetterService
  ) {}

  @Post()
  async createCompanyStandalone(@Body() companyData: CompanyCreateCompactDto) {
    return await this.companyCreatorService.createCompany(companyData);
  }

  @Post('tenant/:tenantId')
  async createCompany(
    @Body() companyData: CompanyCreateCompactDto,
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
}
