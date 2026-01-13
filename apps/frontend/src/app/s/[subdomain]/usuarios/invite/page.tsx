'use client';

import { useEffect, useState } from 'react';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { useCompany } from '@/hooks/use-company';
import { Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ManagerInvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { company } = useCompany();
  const primaryColor = company?.principal_color || '#3B82F6';

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role !== 'AUCTION_MANAGER') {
      router.push('/');
    }
  }, [session, status, router]);

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copiado',
        description: 'Link copiado al portapapeles',
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'No se pudo copiar el link',
        duration: 3000,
      });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInviteLink(null);
    setCopied(false);

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: data?.error || 'No se pudo generar el link',
          duration: 3000,
        });
        return;
      }

      if (!data.token) {
        console.error('API response missing token:', data); // Add debugging
        throw new Error('No se recibió el token de invitación');
      }

      const origin = window.location.origin;
      const link = `${origin}/invite?token=${encodeURIComponent(data.token)}`;
      setInviteLink(link);

      toast({
        title: 'Link generado',
        description: 'Ahora puedes copiar y compartir el link',
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: err.message || 'Error al generar invitación',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Invitar usuario</h1>
      <p className="text-sm text-gray-600 mb-6">
        Genera un link para que el usuario se registre en la plataforma.
      </p>
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@correo.com"
            className="mt-1 border-gray-300"
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
        <Button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          className="text-white w-full"
        >
          {loading ? 'Generando...' : 'Generar invitación'}
        </Button>
      </form>

      {inviteLink && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Link de invitación generado
          </label>
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="flex-1 bg-white" />
            <Button
              type="button"
              onClick={handleCopy}
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            El link expirará en 7 días.
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 font-medium">
              Ahora copia el link y envíaselo a quien quieras invitar a la
              plataforma. Tendrás que generar un link por usuario ya que es de
              un solo uso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
