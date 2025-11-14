'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { FormattedInput } from '@/components/ui/formatted-input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { UserCreateDto, userCreateSchema } from '@suba-go/shared-validation';

// Cache keys for localStorage
const CACHE_KEYS = {
  USER_FORM: 'multiStepForm_userData',
} as const;

// Helper functions for cache management
const saveUserToCache = (data: UserCreateDto) => {
  try {
    localStorage.setItem(CACHE_KEYS.USER_FORM, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save user form data to cache:', error);
  }
};

const loadUserFromCache = (): UserCreateDto | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.USER_FORM);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to load user form data from cache:', error);
    return null;
  }
};

const clearUserCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.USER_FORM);
  } catch (error) {
    console.warn('Failed to clear user form cache:', error);
  }
};

interface UserFormProps {
  onSubmit: (data: UserCreateDto) => void;
  isLoading: boolean;
  initialData: UserCreateDto;
}

export default function UserForm({
  onSubmit,
  isLoading,
  initialData,
}: UserFormProps) {
  // Load cached data or use initial data
  const getCachedOrInitialData = (): UserCreateDto => {
    const cached = loadUserFromCache();
    if (cached) {
      return cached as UserCreateDto;
    }
    return initialData;
  };

  const defaultData = getCachedOrInitialData();

  const [showConfirmPassword, setShowConfirmPassword] = useState(
    !!defaultData.password
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
    setValue,
  } = useForm<UserCreateDto>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: defaultData,
    mode: 'onChange', // Enable real-time validation
  });

  const passwordValue = watch('password');
  const nameValue = watch('name');
  const emailValue = watch('email');

  useEffect(() => {
    setShowConfirmPassword(!!passwordValue);
  }, [passwordValue]);

  // Save form data to cache whenever form values change
  useEffect(() => {
    const currentData = getValues();
    if (currentData.name || currentData.email || currentData.password) {
      saveUserToCache(currentData);
    }
  }, [nameValue, emailValue, passwordValue, getValues]);

  const onFormSubmit = (data: UserCreateDto) => {
    // Clear cache on successful submit
    clearUserCache();
    const normalized: UserCreateDto = {
      ...data,
      email: (data.email || '').trim().toLowerCase(),
    };
    onSubmit(normalized);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          className={`border-gray-300 focus:border-primary ${
            errors.name ? 'border-red-500 focus:border-red-500' : ''
          }`}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <FormattedInput
          id="email"
          type="email"
          formatType="email"
          value={emailValue || ''}
          onChange={(val) => {
            const v = (val ?? '').toString();
            setValue('email', v, { shouldValidate: true, shouldDirty: true });
          }}
          className={`border-gray-300 focus:border-primary ${
            errors.email ? 'border-red-500 focus:border-red-500' : ''
          }`}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          className={`border-gray-300 focus:border-primary ${
            errors.password ? 'border-red-500 focus:border-red-500' : ''
          }`}
        />
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      {showConfirmPassword && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={`border-gray-300 focus:border-primary ${
              errors.confirmPassword
                ? 'border-red-500 focus:border-red-500'
                : ''
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      )}

      {errors.root && (
        <p className="text-sm text-red-600 mt-1">{errors.root.message}</p>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-dark"
        disabled={isLoading || !isValid}
      >
        {isLoading ? 'Creando usuario...' : 'Siguiente'}
      </Button>
    </form>
  );
}
