/**
 * Utility functions for company name normalization
 * Used for consistent subdomain generation and comparison
 */

/**
 * Normalizes a company name to match the subdomain format
 * - Converts to lowercase
 * - Removes all spaces
 * - Removes special characters (keeps only alphanumeric)
 * - Limits to 20 characters
 * 
 * @param name - The company name to normalize
 * @returns The normalized company name suitable for subdomain use
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .substring(0, 20);
}
