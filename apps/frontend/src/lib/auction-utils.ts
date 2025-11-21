/**
 * @file auction-utils.ts
 * @description Utility functions for auction bidding logic
 * @author Suba&Go
 */

import { UserRolesEnum } from '@suba-go/shared-validation';

/**
 * Calculate the next minimum bid amount
 * Formula: max(currentHigh, startingBid) + bidIncrement
 */
export function calculateNextMinBid(
  currentHigh: string | undefined,
  startingBid: string,
  increment: string
): string {
  const current = currentHigh
    ? parseFloat(currentHigh)
    : parseFloat(startingBid);
  const inc = parseFloat(increment);
  return (current + inc).toFixed(2);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toLocaleString('es-CL')}`;
}

/**
 * Parse photos JSON string to array
 */
export function parsePhotos(photosJson: string | null | undefined): string[] {
  if (!photosJson) return [];
  try {
    const parsed = JSON.parse(photosJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse docs JSON string to array
 */
export function parseDocs(docsJson: string | null | undefined): string[] {
  if (!docsJson) return [];
  try {
    const parsed = JSON.parse(docsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if user has USER role
 */
export function isUserRole(role: string | null | undefined): boolean {
  return role === UserRolesEnum.USER;
}
