import { Injectable, CanActivate } from '@nestjs/common';

@Injectable()
export class PublicGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
