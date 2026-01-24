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
