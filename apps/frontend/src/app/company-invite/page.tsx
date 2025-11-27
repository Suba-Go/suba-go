'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

export default function CompanyInvitePage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/companies/invite/verify?token=${encodeURIComponent(t)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          toast({ title: 'Invitación inválida', description: 'El link puede haber expirado' });
        }
      } catch {
        toast({ title: 'Error', description: 'No se pudo verificar la invitación' });
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: 'Invitación inválida' });
      return;
    }
    if (!companyName || companyName.trim().length < 3) {
      toast({ title: 'Nombre inválido', description: 'Mínimo 3 caracteres' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/companies/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, company: { name: companyName } }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data?.error || 'No se pudo crear la empresa' });
      } else {
        toast({ title: 'Empresa creada', description: 'Pronto te contactaremos para configurar tu cuenta' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al aceptar invitación' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Crear empresa</h1>
      <p className="text-sm text-gray-600 mb-6">
        Completa el nombre de tu empresa para registrarla en Suba&Go.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700">Nombre de la empresa</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
        </div>
        <Button type="submit" className="w-full">Crear empresa</Button>
      </form>
    </div>
  );
}
