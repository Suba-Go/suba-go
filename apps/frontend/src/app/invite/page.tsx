'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next-nprogress-bar';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/users/invite/verify?token=${encodeURIComponent(t)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          toast({ title: 'Invitación inválida', description: 'El link puede haber expirado' });
        } else {
          setEmail(data.data.email);
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
    if (password !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data?.error || 'No se pudo crear el usuario' });
      } else {
        toast({ title: 'Usuario creado', description: 'Ahora puedes iniciar sesión' });
        router.push('/login');
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
      <h1 className="text-2xl font-bold mb-2">Aceptar invitación</h1>
      <p className="text-sm text-gray-600 mb-6">
        Completa tu contraseña para crear tu cuenta asociada a la empresa.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <Input value={email} disabled className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-gray-700">Contraseña</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-gray-700">Confirmar contraseña</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
        </div>
        <Button type="submit" className="w-full">Crear cuenta</Button>
      </form>
    </div>
  );
}
