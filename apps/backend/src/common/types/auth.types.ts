import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId?: string;
    companyId?: string;
  };
}


export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
}
