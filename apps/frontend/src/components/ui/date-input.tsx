'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Calendar } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function DateInput({
  value,
  onChange,
  minDate,
  className = '',
  error = false,
  disabled = false,
  style,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCalendarOpen]);

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

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsCalendarOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="dd/mm/yyyy"
          className={`flex-1 ${className} ${
            error
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'focus-visible:ring-1'
          }`}
          style={error ? undefined : style}
          disabled={disabled}
          maxLength={10}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          disabled={disabled}
          className="shrink-0"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
      {isCalendarOpen && (
        <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={minDate ? { before: minDate } : undefined}
            className="rdp"
          />
        </div>
      )}
    </div>
  );
}
