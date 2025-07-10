'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { UserCreateDto, userCreateSchema } from '@suba-go/shared-validation';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(
    !!initialData.password
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<UserCreateDto>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: initialData,
    mode: 'onChange', // Enable real-time validation
  });

  const passwordValue = watch('password');

  useEffect(() => {
    setShowConfirmPassword(!!passwordValue && passwordValue.length > 0);
  }, [passwordValue]);

  const onFormSubmit = (data: UserCreateDto) => {
    onSubmit(data);
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
        <Input
          id="email"
          type="email"
          {...register('email')}
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
