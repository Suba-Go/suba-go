export function validateRUT(rut: string): boolean {
  if (!rut) return false;

  // Remove dots, hyphens, and spaces
  rut = rut.replace(/[.\- ]/g, '');

  // Ensure the RUT is in the correct format
  if (!/^\d{7,8}[\dkK]$/.test(rut)) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier < 7 ? multiplier + 1 : 2;
  }

  const calculatedDv = 11 - (sum % 11);
  const finalDv =
    calculatedDv === 11
      ? '0'
      : calculatedDv === 10
        ? 'K'
        : calculatedDv.toString();

  return finalDv === dv;
}
