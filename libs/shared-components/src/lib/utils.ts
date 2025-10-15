import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'subago.cl';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
