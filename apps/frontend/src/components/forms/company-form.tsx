'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import type { CompanyData } from './multi-step-form';

interface CompanyFormProps {
  onSubmit: (data: CompanyData) => void;
  isLoading: boolean;
  initialData: CompanyData;
  onBack: () => void;
}

export default function CompanyForm({
  onSubmit,
  isLoading,
  initialData,
  onBack,
}: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleColorChange = (field: keyof CompanyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
        <Input
          id="nombreEmpresa"
          type="text"
          value={formData.nombreEmpresa}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nombreEmpresa: e.target.value }))
          }
          required
          className="border-gray-300 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dominio">Dominio</Label>
        <Input
          id="dominio"
          type="text"
          value={formData.dominio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, dominio: e.target.value }))
          }
          required
          placeholder="ejemplo.com"
          className="border-gray-300 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (opcional)</Label>
        <Input
          id="logo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFormData((prev) => ({ ...prev, logo: file }));
          }}
          className="border-gray-300 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorPrincipal">Color Principal (opcional)</Label>
        <Input
          id="colorPrincipal"
          type="color"
          value={formData.colorPrincipal || '#ffcc00'}
          onChange={(e) => handleColorChange('colorPrincipal', e.target.value)}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {formData.colorPrincipal && (
        <div className="space-y-2">
          <Label htmlFor="colorPrincipal2">Color Principal 2 (opcional)</Label>
          <Input
            id="colorPrincipal2"
            type="color"
            value={formData.colorPrincipal2 || '#ffcc00'}
            onChange={(e) =>
              handleColorChange('colorPrincipal2', e.target.value)
            }
            className="border-gray-300 focus:border-primary h-12"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="colorSecundario">Color Secundario (opcional)</Label>
        <Input
          id="colorSecundario"
          type="color"
          value={formData.colorSecundario || '#161b1b'}
          onChange={(e) => handleColorChange('colorSecundario', e.target.value)}
          className="border-gray-300 focus:border-primary h-12"
        />
      </div>

      {formData.colorSecundario && (
        <div className="space-y-2">
          <Label htmlFor="colorSecundario2">
            Color Secundario 2 (opcional)
          </Label>
          <Input
            id="colorSecundario2"
            type="color"
            value={formData.colorSecundario2 || '#161b1b'}
            onChange={(e) =>
              handleColorChange('colorSecundario2', e.target.value)
            }
            className="border-gray-300 focus:border-primary h-12"
          />
        </div>
      )}

      {formData.colorSecundario2 && (
        <div className="space-y-2">
          <Label htmlFor="colorSecundario3">
            Color Secundario 3 (opcional)
          </Label>
          <Input
            id="colorSecundario3"
            type="color"
            value={formData.colorSecundario3 || '#161b1b'}
            onChange={(e) =>
              handleColorChange('colorSecundario3', e.target.value)
            }
            className="border-gray-300 focus:border-primary h-12"
          />
        </div>
      )}

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
          disabled={isLoading}
        >
          {isLoading ? 'Creando empresa...' : 'Crear Empresa'}
        </Button>
      </div>
    </form>
  );
}
