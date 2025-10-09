import {
  Controller,
  Get,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserLookupService } from '../services/user-lookup.service';

@Controller('api/users')
export class UserLookupController {
  constructor(private readonly userLookupService: UserLookupService) {}

  @Get('company-by-email')
  async getCompanyByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email parameter is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      const result = await this.userLookupService.findCompanyByUserEmail(email);

      if (!result) {
        throw new NotFoundException('No company found for this email address');
      }

      return {
        success: true,
        data: {
          companyDomain: result.companyDomain,
          companyName: result.companyName,
          userExists: true,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log the error but don't expose internal details
      console.error('Error looking up company by email:', error);
      throw new BadRequestException('Unable to process request');
    }
  }

  @Get('validate-email-for-tenant')
  async validateEmailForTenant(
    @Query('email') email: string,
    @Query('subdomain') subdomain: string
  ) {
    if (!email || !subdomain) {
      throw new BadRequestException(
        'Email and subdomain parameters are required'
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    try {
      const result = await this.userLookupService.validateEmailForTenant(
        email,
        subdomain
      );
      return { success: true, data: result };
    } catch (error) {
      console.error('Error in validateEmailForTenant controller:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log the error but don't expose internal details
      console.error('Error validating email for tenant:', error);
      throw new BadRequestException('Unable to process request');
    }
  }
}
