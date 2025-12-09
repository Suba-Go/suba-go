'use client';

import { useState } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

export default function CompanyInviteGeneratePage() {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/companies/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data?.error || 'No se pudo generar el link' });
      } else {
        const origin = window.location.origin;
        const link = `${origin}/company-invite?token=${encodeURIComponent(data.token)}`;
        setInviteLink(link);
        toast({ title: 'Link generado', description: 'Copiado al portapapeles' });
        await navigator.clipboard.writeText(link);
      }
    } catch {
      toast({ title: 'Error', description: 'Error al generar invitación' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Invitar proveedor a crear empresa</h1>
      <p className="text-sm text-gray-600 mb-6">
        Genera un link tokenizado para que el proveedor cree su empresa.
      </p>
      <form onSubmit={handleGenerate} className="space-y-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Generando...' : 'Generar invitación'}
        </Button>
      </form>

      {inviteLink && (
        <div className="mt-6">
          <label className="text-sm text-gray-700">Link de invitación</label>
          <Input value={inviteLink} readOnly className="mt-1" />
        </div>
      )}
    </div>
  );
}
