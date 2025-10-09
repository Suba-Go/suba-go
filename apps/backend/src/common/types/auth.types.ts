export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
    role: string;
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
