import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNodeEnv } from './env';

// Determine protocol based on environment
export const protocol = getNodeEnv() === 'local' ? 'http' : 'https';

// Determine root domain based on environment
export const rootDomain =
  getNodeEnv() === 'local'
    ? 'localhost:3000'
    : getNodeEnv() === 'development'
    ? 'development.subago.cl'
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'subago.cl';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
