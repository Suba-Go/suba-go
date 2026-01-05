'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { CompanyDto } from '@suba-go/shared-validation';

type Props = {
  initialData: CompanyDto;
};

export default function CompanySettingsForm({ initialData }: Props) {
  const { data: session } = useSession();
  const isAllowed =
    session?.user?.role === 'ADMIN' ||
    session?.user?.role === 'AUCTION_MANAGER';

  const [form, setForm] = useState({
    name: initialData.name ?? '',
    logo: initialData.logo ?? '',
    background_logo_enabled: initialData.background_logo_enabled ?? false,
    principal_color: initialData.principal_color ?? '#3B82F6',
    principal_color2: initialData.principal_color2 ?? '#60A5FA',
    secondary_color: initialData.secondary_color ?? '#10B981',
    secondary_color2: initialData.secondary_color2 ?? '#34D399',
    secondary_color3: initialData.secondary_color3 ?? '#6366F1',
  });

  const [status, setStatus] = useState<{
    type: 'idle' | 'saving' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isAllowed && (
        <div className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm">
          No tienes permisos para editar la configuración. Solo ADMIN o
          AUCTION_MANAGER.
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Información Básica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Nombre de la Empresa
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isAllowed}
              placeholder="Ej: Wift"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">
              Logo (URL)
            </span>
            <input
              type="text"
              value={form.logo}
              onChange={(e) => updateField('logo', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isAllowed}
              placeholder="https://ejemplo.com/logo.png"
            />
            {form.logo && (
              <div className="mt-2">
                <img
                  src={form.logo}
                  alt="Logo preview"
                  className="h-16 object-contain"
                />
              </div>
            )}
          </label>

          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={form.background_logo_enabled}
              onChange={(e) =>
                updateField('background_logo_enabled', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={!isAllowed}
            />
            <span className="text-sm font-medium text-gray-700">
              Mostrar logo como fondo transparente
            </span>
          </label>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Colores de la Marca
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Color Principal
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={form.principal_color}
                onChange={(e) => updateField('principal_color', e.target.value)}
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                disabled={!isAllowed}
              />
              <input
                type="text"
                value={form.principal_color}
                onChange={(e) => updateField('principal_color', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isAllowed}
                placeholder="#3B82F6"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Color Principal 2
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={form.principal_color2}
                onChange={(e) =>
                  updateField('principal_color2', e.target.value)
                }
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                disabled={!isAllowed}
              />
              <input
                type="text"
                value={form.principal_color2}
                onChange={(e) =>
                  updateField('principal_color2', e.target.value)
                }
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isAllowed}
                placeholder="#60A5FA"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Color Secundario
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                disabled={!isAllowed}
              />
              <input
                type="text"
                value={form.secondary_color}
                onChange={(e) => updateField('secondary_color', e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isAllowed}
                placeholder="#10B981"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Color Secundario 2
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={form.secondary_color2}
                onChange={(e) =>
                  updateField('secondary_color2', e.target.value)
                }
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                disabled={!isAllowed}
              />
              <input
                type="text"
                value={form.secondary_color2}
                onChange={(e) =>
                  updateField('secondary_color2', e.target.value)
                }
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isAllowed}
                placeholder="#34D399"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Color Secundario 3
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={form.secondary_color3}
                onChange={(e) =>
                  updateField('secondary_color3', e.target.value)
                }
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                disabled={!isAllowed}
              />
              <input
                type="text"
                value={form.secondary_color3}
                onChange={(e) =>
                  updateField('secondary_color3', e.target.value)
                }
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isAllowed}
                placeholder="#6366F1"
              />
            </div>
          </label>
        </div>

        {/* Color Preview */}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Vista Previa de Colores
          </h4>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Principal', color: form.principal_color },
              { label: 'Principal 2', color: form.principal_color2 },
              { label: 'Secundario', color: form.secondary_color },
              { label: 'Secundario 2', color: form.secondary_color2 },
              { label: 'Secundario 3', color: form.secondary_color3 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 mt-1">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="submit"
          className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!isAllowed || status.type === 'saving'}
        >
          {status.type === 'saving' ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {status.type === 'error' && (
          <span className="text-sm text-red-600">{status.message}</span>
        )}
        {status.type === 'success' && (
          <span className="text-sm text-green-700">{status.message}</span>
        )}
      </div>
    </form>
  );
}
