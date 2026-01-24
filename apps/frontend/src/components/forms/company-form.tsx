'use client';

import type React from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  companyCompactCreateSchema,
  CompanyCreateCompactDto,
} from '@suba-go/shared-validation';
import { useEffect } from 'react';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const parseColorToRgb = (
  value?: string | null
): { r: number; g: number; b: number } | null => {
  if (!value) return null;
  const v = value.trim().toLowerCase();

  // Hex: #rgb or #rrggbb
  if (v.startsWith('#')) {
    const hex = v.slice(1);
    const isShort = hex.length === 3;
    const isLong = hex.length === 6;
    if (!isShort && !isLong) return null;

    const full = isShort
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  // rgb(r,g,b)
  const rgbMatch = v.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return { r, g, b };
  }

  return null;
};

// WCAG relative luminance
const relativeLuminance = (rgb: { r: number; g: number; b: number }) => {
  const srgb = [rgb.r, rgb.g, rgb.b].map((v) => clamp01(v / 255));
  const lin = srgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};

const contrastRatioWithWhite = (rgb: { r: number; g: number; b: number }) => {
  const L = relativeLuminance(rgb);
  // White luminance is 1.0. White is always lighter than a brand color.
  return (1.0 + 0.05) / (L + 0.05);
};

// Business rule: disallow colors that are too close to white (poor contrast for text).
// We block:
// 1) Pure white, and
// 2) Any color with low contrast vs a white background.
// This catches near-white grays and very light pastel colors.
const isDisallowedPrincipalColor = (value?: string | null) => {
  const rgb = parseColorToRgb(value);
  if (!rgb) return false;

  // Pure white (or effectively white)
  if (rgb.r === 255 && rgb.g === 255 && rgb.b === 255) return true;

  // Contrast rule: if the primary color is used as text on white backgrounds,
  // ensure it remains readable.
  // 4.5:1 is the WCAG AA minimum for normal text and also helps prevent
  // low-contrast headings like the one reported.
  const ratio = contrastRatioWithWhite(rgb);
  if (ratio < 4.5) return true;

  return false;
};

// Cache keys for localStorage
const CACHE_KEYS = {
  COMPANY_FORM: 'multiStepForm_companyData',
} as const;

// Helper functions for cache management
const saveToCache = (data: CompanyCreateCompactDto) => {
  try {
    localStorage.setItem(CACHE_KEYS.COMPANY_FORM, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save form data to cache:', error);
  }
};

const loadFromCache = (): CompanyCreateCompactDto | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.COMPANY_FORM);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const safe = companyCompactCreateSchema.partial().safeParse(parsed);
    if (!safe.success) {
      clearCache();
      return null;
    }

    return {
      name: safe.data.name ?? '',
      background_logo_enabled: safe.data.background_logo_enabled ?? false,
      principal_color: safe.data.principal_color ?? '#3B82F6',
    };
  } catch (error) {
    console.warn('Failed to load form data from cache:', error);
    clearCache();
    return null;
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.COMPANY_FORM);
  } catch (error) {
    console.warn('Failed to clear form cache:', error);
  }
};

interface CompanyFormProps {
  onSubmit: (data: { companyData: CompanyCreateCompactDto }) => void;
  isLoading: boolean;
  initialData: CompanyCreateCompactDto;
  onBack: () => void;
}

export default function CompanyForm({
  onSubmit,
  isLoading,
  initialData,
  onBack,
}: CompanyFormProps) {
  // Load cached data or use initial data
  const getCachedOrInitialData = (): CompanyCreateCompactDto => {
    const cached = loadFromCache();
    if (cached) {
      return cached;
    }
    return {
      name: initialData.name || '',
      background_logo_enabled: initialData.background_logo_enabled ?? false,
      principal_color: initialData.principal_color || '#3B82F6',
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
    setError,
    clearErrors,
  } = useForm<CompanyCreateCompactDto>({
    resolver: zodResolver(
      companyCompactCreateSchema.partial()
    ) as Resolver<CompanyCreateCompactDto>,
    defaultValues: getCachedOrInitialData(),
    mode: 'onChange',
  });

  // Auto-generate subdomain from company name
  const companyName = watch('name');
  const principal_color = watch('principal_color');

  // Business rule: disallow pure white as principal color (affects legibility).
  useEffect(() => {
    if (isDisallowedPrincipalColor(principal_color)) {
      setError('principal_color', {
        type: 'manual',
        message: 'No se puede asignar un color blanco',
      });
      return;
    }

    // Clear manual error if user fixes the color.
    if (errors.principal_color?.type === 'manual') {
      clearErrors('principal_color');
    }
  }, [principal_color, setError, clearErrors, errors.principal_color]);

  // Save form data to cache whenever form values change
  useEffect(() => {
    const currentData = getValues();
    if (currentData.name || currentData.principal_color) {
      saveToCache(currentData);
    }
  }, [companyName, principal_color, getValues]);

  // Handle back button with cache save
  const handleBack = () => {
    const currentData = getValues();
    saveToCache(currentData);
    onBack();
  };

  const onFormSubmit = (data: CompanyCreateCompactDto) => {
    if (isDisallowedPrincipalColor(data.principal_color)) {
      setError('principal_color', {
        type: 'manual',
        message: 'No se puede asignar un color blanco',
      });
      return;
    }

    const companyData: CompanyCreateCompactDto = {
      name: data.name,
      background_logo_enabled: data.background_logo_enabled ?? false,
      principal_color: data.principal_color || null,
    };

    // Clear cache on successful submit
    clearCache();
    onSubmit({ companyData });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nombre de la Empresa</Label>
          <Input
            id="companyName"
            type="text"
            {...register('name')}
            placeholder="Ingresa el nombre de tu empresa"
            className={`border-gray-300 focus:border-primary ${
              errors.name ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="principal_color">Color Principal</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="principal_color"
              {...register('principal_color')}
              type="color"
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <p className="text-sm text-gray-500">
              Este color se usará como color principal de tu empresa
            </p>
          </div>
          {errors.principal_color && (
            <p className="text-sm text-red-600 mt-1">
              {errors.principal_color.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="px-6"
        >
          Atrás
        </Button>
        <Button type="submit" disabled={!isValid || isLoading} className="px-6">
          {isLoading ? 'Creando empresa...' : 'Crear Empresa'}
        </Button>
      </div>
    </form>
  );
}
