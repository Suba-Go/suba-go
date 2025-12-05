'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { useCompany } from '@/hooks/use-company';

interface TimeSelectorProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function TimeSelector({
  value = '10:00',
  onChange,
  className = '',
  error = false,
  disabled = false,
  style,
}: TimeSelectorProps) {
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to hours and minutes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && h >= 0 && h <= 23) setHours(h);
      if (!isNaN(m) && m >= 0 && m <= 59) setMinutes(m);
      setInputValue(value);
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const [hoursStr, minutesStr] = formatted.split(':');
      const h = parseInt(hoursStr, 10);
      const m = parseInt(minutesStr, 10);

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(formatted);
        setHours(h);
        setMinutes(m);
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
      const [hoursStr, minutesStr] = inputValue.split(':');
      const h = parseInt(hoursStr, 10);
      const m = parseInt(minutesStr, 10);

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${hoursStr.padStart(2, '0')}:${minutesStr.padStart(
          2,
          '0'
        )}`;
        setInputValue(formatted);
        onChange(formatted);
        setHours(h);
        setMinutes(m);
      }
    }
  };

  const handleConfirm = () => {
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
    onChange(formatted);
    setInputValue(formatted);
    setIsOpen(false);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="10:00"
          className={`flex-1 font-mono ${className} ${
            error
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'focus-visible:ring-1'
          }`}
          style={error ? undefined : style}
          disabled={disabled}
          maxLength={5}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="shrink-0"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3 right-0">
          <div className="flex items-center justify-center gap-4 py-2">
            {/* Hours Selector */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium mb-2">Horas</label>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className="w-16 px-4 py-2 text-center hover:bg-gray-100 transition-colors bg-white"
                    style={
                      hours === h
                        ? {
                            backgroundColor: primaryColor,
                            color: 'white',
                          }
                        : undefined
                    }
                  >
                    {h.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-2xl font-bold">:</span>

            {/* Minutes Selector */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium mb-2">Minutos</label>
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className="w-16 px-4 py-2 text-center hover:bg-gray-100 transition-colors bg-white"
                    style={
                      minutes === m
                        ? {
                            backgroundColor: primaryColor,
                            color: 'white',
                          }
                        : undefined
                    }
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                color: 'white',
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
