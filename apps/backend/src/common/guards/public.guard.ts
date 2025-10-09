import { Injectable, CanActivate } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class PublicGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
