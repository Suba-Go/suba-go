'use client';

import type React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  companyCompactCreateSchema,
  CompanyCreateCompactDto,
  CompanyCreateDto,
  TenantCreateDto,
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
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to load form data from cache:', error);
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
  onSubmit: (data: {
    companyData: CompanyCreateDto;
    tenantData: TenantCreateDto;
  }) => void;
  isLoading: boolean;
  initialData: CompanyCreateDto;
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
    resolver: zodResolver(companyCompactCreateSchema),
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
    const companyData: CompanyCreateDto = {
      name: data.name,
      logo: null,
      principal_color: data.principal_color || null,
      principal_color2: null,
      secondary_color: null,
      secondary_color2: null,
      secondary_color3: null,
      tenantId: null,
    };

    // Tenant no longer has a name field - company name is used as subdomain
    const tenantData: TenantCreateDto = {};

    // Clear cache on successful submit
    clearCache();

    onSubmit({ companyData, tenantData });
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
