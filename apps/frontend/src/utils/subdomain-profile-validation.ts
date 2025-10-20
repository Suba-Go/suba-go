import { Session } from 'next-auth';

/**
 * Verifica si el perfil del usuario está completo
 * Campos obligatorios: name, phone, rut
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

  console.log('Profile validation:', {
    email: session.user.email,
    name: name ? `${name.substring(0, 3)}...` : 'missing',
    phone: phone ? `${phone.substring(0, 3)}...` : 'missing',
    rut: rut ? `${rut.substring(0, 3)}...` : 'missing',
    isComplete
  });

  return isComplete;
}

/**
 * Obtiene los campos faltantes del perfil del usuario
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
 * Verifica si el usuario pertenece a la empresa del subdominio
 */
export function isUserInCorrectCompany(session: Session | null, subdomain: string): boolean {
  if (!session?.user?.company?.name) {
    return false;
  }

  return session.user.company.name === subdomain;
}
