import { UserRolesEnum } from '@suba-go/shared-validation';
import { Session } from 'next-auth';

/**
 * Verifies if the user profile is complete
 * Required fields: name, phone, rut
 */
export function isUserProfileComplete(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  const { name, phone, rut } = session.user;

  const isComplete = !!(
    name &&
    name.trim().length >= 3 &&
    phone &&
    phone.trim().length > 0 &&
    rut &&
    rut.trim().length > 0
  );

  return isComplete;
}

/**
 * Gets the missing fields from the user profile
 */
export function getMissingProfileFields(session: Session | null): string[] {
  if (!session?.user) {
    return ['name', 'phone', 'rut'];
  }

  const missingFields: string[] = [];
  const { name, phone, rut } = session.user;

  if (!name || name.trim().length < 3) {
    missingFields.push('name');
  }

  if (!phone || phone.trim().length === 0) {
    missingFields.push('phone');
  }

  if (!rut || rut.trim().length === 0) {
    missingFields.push('rut');
  }

  return missingFields;
}

/**
 * Verifies if the user belongs to the subdomain company
 */
export function isUserInCorrectCompany(
  session: Session | null,
  subdomain: string
): boolean {
  if (!session?.user?.company?.name) {
    return false;
  }

  return session.user.company.name === subdomain;
}

/**
 * Verifies if the user has admin or auction manager role
 */
export function isUserAdminOrManager(session: Session | null): boolean {
  if (!session?.user?.role) {
    return false;
  }

  return (
    session.user.role === UserRolesEnum.AUCTION_MANAGER ||
    session.user.role === UserRolesEnum.ADMIN
  );
}
