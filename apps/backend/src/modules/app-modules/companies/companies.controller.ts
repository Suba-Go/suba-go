import { Controller, Post, Body, Param, Get, Patch, UseGuards, Query, Request } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CompanyCreatorService } from './services/company-creator.service';
import { CompanyGetterService } from './services/company-getter.service';
<<<<<<< HEAD
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
=======
import { CompanyCreateCompactDto } from '@suba-go/shared-validation';
>>>>>>> development

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companyCreatorService: CompanyCreatorService,
    private readonly companyGetterService: CompanyGetterService,
    private readonly companyUpdaterService: CompanyUpdaterService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async updateCompany(
    @Param('id') id: string,
    @Body() updateData: CompanyUpdateDto
  ) {
    return await this.companyUpdaterService.updateCompany(id, updateData);
  }

  // Invitation endpoints for providers to create a company (tokenized)
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRolesEnum.ADMIN, UserRolesEnum.AUCTION_MANAGER)
  async createCompanyInvite(
    @Body() body: { tenantId?: string },
    @Request() req: any
  ) {
    const expires = this.configService.get<string>('INVITE_EXPIRY_TIME') || '14d';
    const token = this.jwtService.sign(
      {
        tenantId: body.tenantId || req.user?.tenantId,
        invitedBy: req.user?.id || req.user?.userId,
        scope: 'COMPANY_CREATE',
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: expires,
      }
    );
    const expiryDate = new Date();
    const daysMatch = /^([0-9]+)d$/.exec(expires);
    if (daysMatch) {
      expiryDate.setDate(expiryDate.getDate() + parseInt(daysMatch[1], 10));
    }
    return { token, expiresAt: expiryDate.toISOString() };
  }

  @Get('invite/verify')
  async verifyCompanyInvite(@Query('token') token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return { valid: true, data: payload };
    } catch {
      return { valid: false, error: 'Token inválido o expirado' };
    }
  }

  @Post('invite/accept')
  async acceptCompanyInvite(
    @Body() body: { token: string; company: CompanyCreateDto }
  ) {
    const { token, company } = body;
    if (!token || !company?.name) {
      throw new Error('Datos inválidos');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      if (payload?.scope !== 'COMPANY_CREATE') {
        throw new Error('Token inválido');
      }
    } catch {
      throw new Error('Token inválido o expirado');
    }
    const tenantId = payload.tenantId as string | undefined;
    const created = await this.companyCreatorService.createCompany(
      company,
      tenantId
    );
    return { success: true, company: created };
  }
}
