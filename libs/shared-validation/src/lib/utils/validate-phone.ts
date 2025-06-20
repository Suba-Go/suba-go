export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Validar números con +569 o +562 al principio
  const regex = /^\+56(9\d{8}|2\d{8})$/;
  return regex.test(phone);
}
