'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function DateInput({
  value,
  onChange,
  minDate,
  className = '',
  error = false,
  disabled = false,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Format date to dd/mm/yyyy
  const formatDate = (date: Date | undefined): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Parse dd/mm/yyyy to Date
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;

    // Remove any non-digit characters except /
    const cleaned = dateString.replace(/[^\d/]/g, '');

    // Check if it matches dd/mm/yyyy pattern
    const parts = cleaned.split('/');
    if (parts.length !== 3) return undefined;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate ranges
    if (day < 1 || day > 31) return undefined;
    if (month < 1 || month > 12) return undefined;
    if (year < 1900 || year > 2100) return undefined;

    // Create date (month is 0-indexed in JS)
    const date = new Date(year, month - 1, day);

    // Verify the date is valid (handles invalid dates like 31/02/2024)
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return undefined;
    }

    return date;
  };

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(formatDate(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Remove any non-digit characters except /
    newValue = newValue.replace(/[^\d/]/g, '');

    // Auto-add slashes as user types
    if (newValue.length === 2 && inputValue.length === 1) {
      newValue += '/';
    } else if (newValue.length === 5 && inputValue.length === 4) {
      newValue += '/';
    }

    // Limit to 10 characters (dd/mm/yyyy)
    if (newValue.length > 10) {
      newValue = newValue.slice(0, 10);
    }

    setInputValue(newValue);

    // Try to parse and validate the date
    if (newValue.length === 10) {
      const parsedDate = parseDate(newValue);

      if (parsedDate) {
        // Check if date is before minDate
        if (minDate) {
          const minDateOnly = new Date(minDate);
          minDateOnly.setHours(0, 0, 0, 0);
          const parsedDateOnly = new Date(parsedDate);
          parsedDateOnly.setHours(0, 0, 0, 0);

          if (parsedDateOnly < minDateOnly) {
            // Don't update if before minDate
            return;
          }
        }

        onChange(parsedDate);
      } else {
        onChange(undefined);
      }
    } else {
      onChange(undefined);
    }
  };

  const handleBlur = () => {
    // Reformat on blur if valid
    if (inputValue.length === 10) {
      const parsedDate = parseDate(inputValue);
      if (parsedDate) {
        setInputValue(formatDate(parsedDate));
      }
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="dd/mm/yyyy"
      className={`${className} ${error ? 'border-red-500' : ''}`}
      disabled={disabled}
      maxLength={10}
    />
  );
}
