'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';

interface TimeInputProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function TimeInput({
  value = '',
  onChange,
  className = '',
  error = false,
  disabled = false,
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Remove any non-digit characters except :
    newValue = newValue.replace(/[^\d:]/g, '');
    
    // Auto-add colon as user types
    if (newValue.length === 2 && inputValue.length === 1 && !newValue.includes(':')) {
      newValue += ':';
    }
    
    // Limit to 5 characters (HH:MM)
    if (newValue.length > 5) {
      newValue = newValue.slice(0, 5);
    }
    
    setInputValue(newValue);
    
    // Validate and update if complete
    if (newValue.length === 5) {
      const [hours, minutes] = newValue.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(newValue);
      }
    } else if (newValue.length === 0) {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Reformat on blur if valid
    if (inputValue.length === 5) {
      const [hours, minutes] = inputValue.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
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
      onBlur={handleBlur}
      placeholder="HH:MM"
      className={`${className} ${error ? 'border-red-500' : ''}`}
      disabled={disabled}
      maxLength={5}
    />
  );
}

