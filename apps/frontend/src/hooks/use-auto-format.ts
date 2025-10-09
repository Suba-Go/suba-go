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
    return cleanValue ? parseInt(cleanValue, 10) : undefined;
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
    return cleanValue ? parseFloat(cleanValue) : undefined;
  }, []);

  return {
    formatPlate,
    formatCapitalize,
    formatNumberWithSeparators,
    formatSimpleNumber,
    parseFormattedNumber,
    formatPrice,
    parseFormattedPrice,
  };
}
