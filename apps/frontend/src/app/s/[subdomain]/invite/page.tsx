'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { useCompany } from '@/hooks/use-company';
import { PasswordChecklist } from '@/components/auth/password-checklist';
import { apiFetch } from '@/lib/api/api-fetch';

import { Check, Circle, X } from 'lucide-react';

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  useEffect(() => {
    const t = searchParams.get('token');
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/users/invite/verify?token=${encodeURIComponent(t)}`
        );
        const data = await res.json();
        if (!res.ok || !data.valid) {
          toast({
            title: 'Invitación inválida',
            variant: 'destructive',
            description: 'El link puede haber expirado',
            duration: 3000,
          });
        } else {
          setEmail(data.data.email);
        }
      } catch {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'No se pudo verificar la invitación',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: 'Invitación inválida',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    // Removed duplicate toast for mismatch
    if (password !== confirmPassword) {
      // toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' }); // Deleted as requested
      return;
    }
    if (password.length < 8) {
      toast({
        title: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast({
        title: 'La contraseña debe tener al menos una mayúscula',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast({
        title: 'La contraseña debe tener al menos una minúscula',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/users/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: data?.error || 'No se pudo crear el usuario',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Usuario creado',
          variant: 'default',
          description: 'Ahora puedes iniciar sesión',
          duration: 3000,
        });
        router.push('/login');
      }
    } catch {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Error al aceptar invitación',
        duration: 3000,
      });
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
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            style={
              {
                '--tw-ring-color': primaryColor,
                borderColor: 'focus:' + primaryColor,
              } as React.CSSProperties & { '--tw-ring-color': string }
            }
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
          <PasswordChecklist password={password} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Confirmar contraseña</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            style={
              {
                '--tw-ring-color': primaryColor,
                borderColor: 'focus:' + primaryColor,
              } as React.CSSProperties & { '--tw-ring-color': string }
            }
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor;
              e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Passwords match indicator */}
        {confirmPassword && (
          <div
            className={`flex items-center text-sm mt-1 ${
              password === confirmPassword ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {password === confirmPassword ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Circle className="w-4 h-4 mr-2" />
            )}
            <span>Las contraseñas coinciden</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full text-white"
          style={{ backgroundColor: primaryColor }}
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </div>
  );
}
