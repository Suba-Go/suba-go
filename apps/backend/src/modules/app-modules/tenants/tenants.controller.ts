import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TenantCreatorService } from './services/tenant-creator.service';
import { TenantCreateDto } from '@suba-go/shared-validation';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantCreatorService: TenantCreatorService,
  ) {}

  @Post()
  async createTenant(@Body() tenantData: TenantCreateDto) {
    return await this.tenantCreatorService.createTenant(tenantData);
  }

  @Get()
  async getAllTenants() {
    return await this.tenantCreatorService.getAllTenants();
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string) {
    return await this.tenantCreatorService.getTenantById(id);
  }

  @Get('domain/:domain')
  async getTenantByDomain(@Param('domain') domain: string) {
    return await this.tenantCreatorService.getTenantByDomain(domain);
  }
}
