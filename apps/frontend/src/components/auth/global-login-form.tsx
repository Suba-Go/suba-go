'use client';

import { useState } from 'react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import Link from 'next/link';

export default function GlobalLoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Formato de email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call backend to find user's company
      const response = await fetch(
        `/api/users/company-by-email?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Usuario no encontrado',
            description: 'No se encontró una cuenta asociada a este email.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Error al buscar la empresa');
      }

      const data = await response.json();

      if (data.success && data.data && data.data.companyDomain) {
        // Redirect to company-specific login
        const protocol =
          process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const rootDomain =
          process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
        const port = process.env.NODE_ENV === 'production' ? '' : ':3000';

        let companyLoginUrl: string;
        if (process.env.NODE_ENV === 'development') {
          companyLoginUrl = `${protocol}://${
            data.data.companyDomain
          }.localhost${port}/login?email=${encodeURIComponent(email)}`;
        } else {
          companyLoginUrl = `${protocol}://${
            data.data.companyDomain
          }.${rootDomain}/login?email=${encodeURIComponent(email)}`;
        }

        toast({
          title: 'Redirigiendo...',
          description: `Te estamos llevando a la página de ${data.data.companyName}`,
        });

        // Small delay to show the toast
        setTimeout(() => {
          window.location.href = companyLoginUrl;
        }, 1500);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error during email lookup:', error);
      toast({
        title: 'Error',
        description:
          'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Iniciar Sesión
        </h1>
        <p className="text-gray-600">
          Ingresa tu email para acceder a tu empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            className={errors.email ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? 'Buscando empresa...' : 'Continuar'}
        </Button>
      </form>
      <div className="mt-6 text-center p-3">
        <p className="text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link
            href="/#formulario"
            className="text-primary hover:underline font-medium"
          >
            Crear empresa
          </Link>
        </p>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
