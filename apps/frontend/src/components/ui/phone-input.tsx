'use client';

import type React from 'react';
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import { FormattedInput } from '@/components/ui/formatted-input';
import { useAutoFormat } from '@/hooks/use-auto-format';

interface CountryOption {
  code: string; // E.g. "+56"
  label: string; // E.g. "Chile (+56)"
}

interface PhoneInputProps {
  value: string; // full phone string as displayed, e.g. "+56 9 1234 5678" o "56 912345678"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function PhoneInput({
  value,
  onChange,
  className,
  placeholder = '+56 9 1234 5678',
  style,
}: PhoneInputProps) {
  const { composeIntlPhone, formatPhoneChile } = useAutoFormat();

  const countries: CountryOption[] = useMemo(
    () => [{ code: '+56', label: 'Chile (+56)' }],
    []
  );

  // Infer current prefix from value
  const currentPrefix = useMemo(() => {
    const match = value.match(/^\+\d{1,3}/);
    if (match) return match[0];
    // If it comes as 56 without +
    if (value.startsWith('56')) return '+56';
    return '+56';
  }, [value]);

  const nationalPart = useMemo(() => {
    // Remove international prefix visible
    const rest = value.replace(/^\+?56\s?/, '');
    return formatPhoneChile(rest);
  }, [value, formatPhoneChile]);

  const handlePrefixChange = (newPrefix: string) => {
    onChange(composeIntlPhone(newPrefix, nationalPart));
  };

  const handleNationalChange = (val: string | number | undefined) => {
    const str = (val ?? '').toString();
    onChange(composeIntlPhone(currentPrefix, str));
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`} style={style}>
      <Select value={currentPrefix} onValueChange={handlePrefixChange}>
        <SelectTrigger className="w-[140px]" style={style}>
          <SelectValue placeholder="+56" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormattedInput
        formatType="phone"
        value={nationalPart}
        onChange={handleNationalChange}
        placeholder={placeholder}
        className="flex-1"
        style={style}
      />
    </div>
  );
}
