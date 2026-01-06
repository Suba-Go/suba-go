'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { CompanyDto } from '@suba-go/shared-validation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { Upload } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@suba-go/shared-components/components/ui/card';
import { Input } from '@suba-go/shared-components/components/ui/input';

type Props = {
  initialData: CompanyDto;
};

export default function CompanySettingsForm({ initialData }: Props) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAllowed =
    session?.user?.role === 'ADMIN' ||
    session?.user?.role === 'AUCTION_MANAGER';

  const [form, setForm] = useState({
    name: initialData.name ?? '',
    logo: initialData.logo ?? '',
    background_logo_enabled: initialData.background_logo_enabled ?? false,
    principal_color: initialData.principal_color ?? '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'saving' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: 'Error',
        description: 'El archivo es demasiado grande. Máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const blob = await response.json();
      updateField('logo', blob.url);
      toast({
        title: 'Éxito',
        description: 'Logo subido correctamente',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset input value to allow uploading same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;

    setStatus({ type: 'saving' });
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al actualizar la empresa');
      }

      setStatus({
        type: 'success',
        message: 'Cambios guardados correctamente.',
      });
      // Reload page after 1 second to show updated changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error?.message || 'Ocurrió un error',
      });
    }
  };

  if (!isAllowed) {
    return (
      <div className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm">
        No tienes permisos para editar la configuración. Solo ADMIN o
        AUCTION_MANAGER.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>
            Configura los detalles básicos de tu empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Nombre de la Empresa
            </label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Wift"
              disabled={!isAllowed}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle>Marca y Apariencia</CardTitle>
          <CardDescription>
            Personaliza el logo y los colores de tu plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Logo
            </label>
            <div className="flex items-center gap-4">
              {form.logo && (
                <div className="p-2 border rounded-md bg-gray-50 h-16 w-32 flex items-center justify-center">
                  <img
                    src={form.logo}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!isAllowed || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAllowed || isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Subiendo...' : 'Subir Logo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Background Logo Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="bg-logo"
              checked={form.background_logo_enabled}
              onChange={(e) =>
                updateField('background_logo_enabled', e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={!isAllowed}
            />
            <label
              htmlFor="bg-logo"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Usar logo como marca de agua en el fondo
            </label>
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Color Principal
            </label>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-16 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                <input
                  type="color"
                  value={form.principal_color || '#3B82F6'}
                  onChange={(e) =>
                    updateField('principal_color', e.target.value)
                  }
                  className="absolute -top-2 -left-2 h-16 w-20 cursor-pointer p-0 border-0"
                  disabled={!isAllowed}
                />
              </div>
              <Input
                type="text"
                value={form.principal_color}
                onChange={(e) => updateField('principal_color', e.target.value)}
                placeholder="#3B82F6"
                className="w-32 font-mono"
                disabled={!isAllowed}
              />
            </div>
            <p className="text-xs text-gray-500">
              Este color se utilizará en botones, enlaces y elementos
              destacados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          style={{
            backgroundColor: form.principal_color || '#3B82F6',
          }}
          disabled={!isAllowed || status.type === 'saving'}
          className="text-white"
        >
          {status.type === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
        </Button>

        {status.type === 'error' && (
          <span className="text-sm text-red-600">{status.message}</span>
        )}
        {status.type === 'success' && (
          <span className="text-sm text-green-700 font-medium">
            {status.message}
          </span>
        )}
      </div>
    </form>
  );
}
