'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { useAutoFormat } from '@/hooks/use-auto-format';

type FormatType =
  | 'plate'
  | 'capitalize'
  | 'number'
  | 'simple-number'
  | 'price'
  | 'none';

interface FormattedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  formatType: FormatType;
  onChange: (value: string | number | undefined) => void;
  value?: string | number;
  className?: string;
}

export function FormattedInput({
  formatType,
  onChange,
  value = '',
  className,
  ...props
}: FormattedInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const {
    formatPlate,
    formatCapitalize,
    formatNumberWithSeparators,
    formatSimpleNumber,
    parseFormattedNumber,
    formatPrice,
    parseFormattedPrice,
  } = useAutoFormat();

  // Sincronizar valor inicial
  useEffect(() => {
    if (value !== undefined && value !== null) {
      switch (formatType) {
        case 'plate':
          setDisplayValue(formatPlate(value.toString()));
          break;
        case 'capitalize':
          setDisplayValue(formatCapitalize(value.toString()));
          break;
        case 'number':
          setDisplayValue(formatNumberWithSeparators(value));
          break;
        case 'simple-number':
          setDisplayValue(formatSimpleNumber(value));
          break;
        case 'price':
          setDisplayValue(formatPrice(value));
          break;
        default:
          setDisplayValue(value.toString());
      }
    } else {
      setDisplayValue('');
    }
  }, [
    value,
    formatType,
    formatPlate,
    formatCapitalize,
    formatNumberWithSeparators,
    formatSimpleNumber,
    formatPrice,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    let formattedValue = inputValue;
    let parsedValue: string | number | undefined = inputValue;

    switch (formatType) {
      case 'plate': {
        // Limitar a 6 caracteres y convertir a mayúsculas
        const plateValue = inputValue.slice(0, 6);
        formattedValue = formatPlate(plateValue);
        parsedValue = formattedValue;
        break;
      }

      case 'capitalize': {
        formattedValue = formatCapitalize(inputValue);
        parsedValue = formattedValue;
        break;
      }

      case 'number': {
        // Solo permitir números con separadores
        const numbersOnly = inputValue.replace(/\D/g, '');
        formattedValue = formatNumberWithSeparators(numbersOnly);
        parsedValue = parseFormattedNumber(formattedValue);
        break;
      }

      case 'simple-number': {
        // Solo permitir números sin separadores
        const simpleNumbersOnly = inputValue.replace(/\D/g, '');
        formattedValue = formatSimpleNumber(simpleNumbersOnly);
        parsedValue = simpleNumbersOnly
          ? parseInt(simpleNumbersOnly, 10)
          : undefined;
        break;
      }

      case 'price': {
        // Solo permitir números para precio
        const priceNumbersOnly = inputValue.replace(/[^0-9]/g, '');
        formattedValue = formatPrice(priceNumbersOnly);
        parsedValue = parseFormattedPrice(formattedValue);
        break;
      }

      default:
        formattedValue = inputValue;
        parsedValue = inputValue;
    }

    // Actualizar inmediatamente el valor mostrado
    setDisplayValue(formattedValue);
    // Llamar onChange inmediatamente
    onChange(parsedValue);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  );
}
