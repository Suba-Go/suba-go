'use client';

import type React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import {
  CompanyCreateDto,
  TenantCreateDto,
  companyCreateSchema,
  tenantCreateSchema,
} from '@suba-go/shared-validation';
import { z } from 'zod';

// Combined schema for both company and tenant data
const combinedSchema = z.object({
  companyData: companyCreateSchema,
  tenantData: tenantCreateSchema,
});

type CombinedFormData = z.infer<typeof combinedSchema>;

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
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<CombinedFormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      companyData: {
        name: initialData.name || '',
        logo: initialData.logo || null,
        principal_color: initialData.principal_color || null,
        principal_color2: initialData.principal_color2 || null,
        secondary_color: initialData.secondary_color || null,
        secondary_color2: initialData.secondary_color2 || null,
        secondary_color3: initialData.secondary_color3 || null,
      },
      tenantData: {
        name: '',
        subdomain: '',
      },
    },
    mode: 'onChange',
  });

  const onFormSubmit = (data: CombinedFormData) => {
    onSubmit(data);
  };

  const clearColor = (colorField: keyof CompanyCreateDto) => {
    setValue(`companyData.${colorField}`, null);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Nombre de la Empresa</Label>
        <Input
          id="companyName"
          type="text"
          {...register('companyData.name')}
          className={`border-gray-300 focus:border-primary ${
            errors.companyData?.name
              ? 'border-red-500 focus:border-red-500'
              : ''
          }`}
        />
        {errors.companyData?.name && (
          <p className="text-sm text-red-600 mt-1">
            {errors.companyData.name.message}
          </p>
        )}
      </div>

      {(() => {
        return (
          <div className="space-y-2">
            <Label htmlFor="domain">Dominio</Label>
            <div className="flex items-center">
              <p className="text-lg text-black-500 mt-1">www.</p>
              <Input
                id="domain"
                type="text"
                {...register('tenantData.subdomain')}
                placeholder={'subdominio'}
                className={`border-gray-300 focus:border-primary ${
                  errors.tenantData?.subdomain
                    ? 'border-red-500 focus:border-red-500'
                    : ''
                }`}
              />
              <p className="text-lg text-black-500 mt-1">.subago.com</p>
            </div>
            {errors.tenantData?.subdomain && (
              <p className="text-sm text-red-600 mt-1">
                {errors.tenantData.subdomain.message}
              </p>
            )}
          </div>
        );
      })()}

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (opcional)</Label>
        <Input
          id="logo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setValue('companyData.logo', reader.result as string);
              };
              reader.readAsDataURL(file);
            } else {
              setValue('companyData.logo', null);
            }
          }}
          className="border-gray-300 focus:border-primary"
        />
      </div>

      {/* Color Principal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="principal_color">Color Principal (opcional)</Label>
          {watch('companyData.principal_color') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearColor('principal_color')}
              className="text-red-600 hover:text-red-700"
            >
              Quitar color
            </Button>
          )}
        </div>
        <Input
          id="principal_color"
          type="color"
          {...register('companyData.principal_color')}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {/* Color Principal 2 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="principal_color2">Color Principal 2 (opcional)</Label>
          {watch('companyData.principal_color2') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearColor('principal_color2')}
              className="text-red-600 hover:text-red-700"
            >
              Quitar color
            </Button>
          )}
        </div>
        <Input
          id="principal_color2"
          type="color"
          {...register('companyData.principal_color2')}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {/* Color Secundario */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="secondary_color">Color Secundario (opcional)</Label>
          {watch('companyData.secondary_color') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearColor('secondary_color')}
              className="text-red-600 hover:text-red-700"
            >
              Quitar color
            </Button>
          )}
        </div>
        <Input
          id="secondary_color"
          type="color"
          {...register('companyData.secondary_color')}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {/* Color Secundario 2 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="secondary_color2">
            Color Secundario 2 (opcional)
          </Label>
          {watch('companyData.secondary_color2') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearColor('secondary_color2')}
              className="text-red-600 hover:text-red-700"
            >
              Quitar color
            </Button>
          )}
        </div>
        <Input
          id="secondary_color2"
          type="color"
          {...register('companyData.secondary_color2')}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {/* Color Secundario 3 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="secondary_color3">
            Color Secundario 3 (opcional)
          </Label>
          {watch('companyData.secondary_color3') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearColor('secondary_color3')}
              className="text-red-600 hover:text-red-700"
            >
              Quitar color
            </Button>
          )}
        </div>
        <Input
          id="secondary_color3"
          type="color"
          {...register('companyData.secondary_color3')}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 border-gray-300 text-dark hover:bg-gray-50 bg-transparent"
          disabled={isLoading}
        >
          Atrás
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary/90 text-dark"
          disabled={isLoading || !isValid}
        >
          {isLoading ? 'Creando empresa...' : 'Crear Empresa'}
        </Button>
      </div>
    </form>
  );
}
