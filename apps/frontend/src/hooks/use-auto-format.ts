'use client';

import { useCallback } from 'react';

export function useAutoFormat() {
  // Formatear patente a mayúsculas
  const formatPlate = useCallback((value: string) => {
    return value.toUpperCase();
  }, []);

  // Formatear marca y modelo con primera letra mayúscula
  const formatCapitalize = useCallback((value: string) => {
    return value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Formatear números con separadores de miles (solo visual)
  const formatNumberWithSeparators = useCallback((value: string | number) => {
    const numStr = value.toString().replace(/\D/g, ''); // Solo números
    if (!numStr) return '';

    // Agregar puntos cada 3 dígitos desde la derecha
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, []);

  // Formatear números simples (sin separadores)
  const formatSimpleNumber = useCallback((value: string | number) => {
    const numStr = value.toString().replace(/\D/g, ''); // Solo números
    return numStr;
  }, []);

  // Parsear número formateado de vuelta a número
  const parseFormattedNumber = useCallback((value: string) => {
    const cleanValue = value.replace(/\./g, ''); // Remover puntos
    return cleanValue ? Number.parseInt(cleanValue, 10) : undefined;
  }, []);

  // Formatear precio con separadores y símbolo de moneda
  const formatPrice = useCallback(
    (value: string | number) => {
      const formatted = formatNumberWithSeparators(value);
      return formatted ? `$${formatted}` : '';
    },
    [formatNumberWithSeparators]
  );

  // Parsear precio formateado
  const parseFormattedPrice = useCallback((value: string) => {
    const cleanValue = value.replace(/\$|[.]/g, ''); // Remover $ y puntos
    return cleanValue ? Number.parseFloat(cleanValue) : undefined;
  }, []);

  // Format Chilean phone number in real time: +56 9 1234 5678
  const formatPhoneChile = useCallback((value: string) => {
    if (!value) return '';
    // Keep only digits
    const digits = value.replace(/\D/g, '');

    // Recognize prefix 569 if included, but the external component may add "+"
    let rest = digits;
    if (rest.startsWith('569')) {
      rest = rest.slice(2);
    }

    // Limit to 9 national digits maximum
    const limited = rest.slice(0, 9);

    // Common format in CL: 9 XXXX XXXX (1-4-4)
    if (limited.length <= 1) return limited; // 9
    if (limited.length <= 5) return `${limited.slice(0, 1)} ${limited.slice(1)}`; // 9 1234
    return `${limited.slice(0, 1)} ${limited.slice(1, 5)} ${limited.slice(5)}`; // 9 1234 5678
  }, []);

  // Compose full phone with international prefix visible
  const composeIntlPhone = useCallback((countryCode: string, national: string) => {
    const cleanNational = formatPhoneChile(national);
    if (!cleanNational) return countryCode; // Only prefix
    return `${countryCode} ${cleanNational}`;
  }, [formatPhoneChile]);

  // Clean version (numbers) of the full phone, useful for sending/validation
  const parseFormattedPhone = useCallback((value: string) => {
    return value.replace(/\D/g, '');
  }, []);

  // Format email: lowercase, trim spaces, collapse internal spaces
  const formatEmailLower = useCallback((value: string | number) => {
    const str = value.toString();
    // Remove leading/trailing spaces and unnecessary internal spaces
    const cleaned = str.trim().replace(/\s+/g, '');
    return cleaned.toLowerCase();
  }, []);

  // Format Chilean RUT: 12.345.678-9 (accepts inputs without format and with k/K)
  const formatRut = useCallback((value: string) => {
    if (!value) return '';
    // Clean: keep digits and k/K
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!clean) return '';

    // Separate body and DV (if there are 2+ characters, the last one is DV)
    const body = clean.slice(0, -1).replace(/\D/g, '');
    const dv = clean.slice(-1); // can be a digit or K

    // If there is only one character, there is no DV; treat everything as body
    const bodyDigits = clean.length === 1 ? clean : body;

    // Limit to 8 body digits maximum
    const limitedBody = bodyDigits.slice(0, 8);

    // Add dots as thousands to the body
    const withDots = limitedBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // If there is DV (when the original input had 2+), add hyphen + DV
    const hasDv = clean.length >= 2;
    return hasDv ? `${withDots}-${dv}` : withDots;
  }, []);

  // Get clean version of the RUT without points, with hyphen if there is DV
  const parseFormattedRut = useCallback((value: string) => {
    if (!value) return '';
    const clean = value.replace(/[.\s]/g, '').toUpperCase();
    return clean;
  }, []);

  return {
    formatPlate,
    formatCapitalize,
    formatNumberWithSeparators,
    formatSimpleNumber,
    parseFormattedNumber,
    formatPrice,
    parseFormattedPrice,
    formatRut,
    parseFormattedRut,
    formatPhoneChile,
    composeIntlPhone,
    parseFormattedPhone,
    formatEmailLower,
  };
}
