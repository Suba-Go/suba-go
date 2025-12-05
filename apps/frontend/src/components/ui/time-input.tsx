'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';

interface TimeInputProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function TimeInput({
  value = '',
  onChange,
  className = '',
  error = false,
  disabled = false,
  style,
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Remove any non-digit characters
    newValue = newValue.replace(/\D/g, '');

    // Limit to 4 digits (HHMM)
    if (newValue.length > 4) {
      newValue = newValue.slice(0, 4);
    }

    // Format as HH:MM
    let formatted = newValue;
    if (newValue.length >= 2) {
      formatted = newValue.slice(0, 2) + ':' + newValue.slice(2);
    }

    setInputValue(formatted);

    // Validate and update if complete
    if (formatted.length === 5) {
      const [hours, minutes] = formatted.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(formatted);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent deleting the colon
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
      const value = (e.target as HTMLInputElement).value;

      // If trying to delete the colon, prevent it
      if (value[cursorPos] === ':') {
        e.preventDefault();
        // Move cursor to the left
        (e.target as HTMLInputElement).setSelectionRange(
          cursorPos - 1,
          cursorPos - 1
        );
      }
    }
  };

  const handleBlur = () => {
    // Reformat on blur if valid
    if (inputValue.length === 5) {
      const [hours, minutes] = inputValue.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${hours.padStart(2, '0')}:${minutes.padStart(
          2,
          '0'
        )}`;
        setInputValue(formatted);
        onChange(formatted);
      }
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="10:00"
      className={`${className} ${
        error
          ? 'border-red-500 focus-visible:ring-red-500'
          : 'focus-visible:ring-1'
      } font-mono`}
      style={error ? undefined : style}
      disabled={disabled}
      maxLength={5}
    />
  );
}
