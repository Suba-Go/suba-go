// Common API types to replace 'any' usage

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface FormData {
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface SocketMessage {
  type: string;
  data: unknown;
  timestamp?: number;
}

export interface WebSocketEvent {
  event: string;
  data: unknown;
  room?: string;
}
