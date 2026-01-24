'use client';

import { useState } from 'react';
import { FEEDBACK_CATEGORIES } from '@suba-go/shared-validation';
import { apiFetch } from '@/lib/api/api-fetch';

export default function FeedbackForm({
  onSuccess,
  primaryColor = '#3B82F6',
}: {
  onSuccess?: () => void;
  primaryColor?: string;
}) {
  const [form, setForm] = useState({
    category: FEEDBACK_CATEGORIES[0],
    title: '',
    message: '',
  });

  const [status, setStatus] = useState<{
    type: 'idle' | 'submitting' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'submitting' });

    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Error al enviar feedback');
      }

      setStatus({
        type: 'success',
        message: '¡Gracias! Tu feedback ha sido enviado correctamente.',
      });

      // Reset form
      setForm({
        category: FEEDBACK_CATEGORIES[0],
        title: '',
        message: '',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error?.message || 'Ocurrió un error al enviar el feedback',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as any })
          }
          className="w-full rounded-md px-3 py-2 focus:ring-2 outline-none"
          style={
            {
              '--tw-ring-color': primaryColor,
              borderColor:
                'var(--tw-border-opacity) ? rgba(209, 213, 219, var(--tw-border-opacity)) : undefined',
            } as React.CSSProperties
          }
          required
        >
          {FEEDBACK_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la categoría que mejor describa tu feedback
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:border-transparent outline-none"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          placeholder="Resumen breve de tu feedback"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:border-transparent outline-none"
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          placeholder="Describe tu feedback en detalle..."
          rows={6}
          required
          maxLength={5000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {form.message.length} / 5000 caracteres
        </p>
      </div>

      {status.type === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{status.message}</p>
        </div>
      )}

      {status.type === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{status.message}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status.type === 'submitting'}
          className="px-6 py-2 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          {status.type === 'submitting' ? 'Enviando...' : 'Enviar Feedback'}
        </button>

        {(form.title || form.message) && (
          <button
            type="button"
            onClick={() =>
              setForm({
                category: FEEDBACK_CATEGORIES[0],
                title: '',
                message: '',
              })
            }
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}
