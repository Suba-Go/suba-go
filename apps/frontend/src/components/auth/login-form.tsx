'use client';

import { useState } from 'react';
import { useRouter } from 'next-nprogress-bar';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { getNodeEnv } from '@suba-go/shared-components';
import { getUserCompanyDomainTrpcAction } from '@/domain/trpc-actions/user/get-user-company-domain-trpc-action';
import { z } from 'zod';
import { email } from '@suba-go/shared-validation';

const loginSchema = z.object({
  email: email,
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<LoginFormData> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as keyof LoginFormData] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Clear any existing session cookies before login
    if (getNodeEnv() === 'local') {
      // Clear cookies for both localhost and .localhost domain
      document.cookie =
        'authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie =
        'authjs.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie =
        'authjs.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie =
        'authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
      document.cookie =
        'authjs.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
      document.cookie =
        'authjs.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Error de autenticación',
          description: 'Email o contraseña incorrectos',
          variant: 'destructive',
        });
      } else if (result?.ok) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Redirigiendo a tu empresa...',
        });

        // Get user's company domain and redirect
        try {
          const domainResult = await getUserCompanyDomainTrpcAction(
            formData.email
          );

          if (domainResult.success && domainResult.data?.domain) {
            // Redirect to the user's company domain
            window.location.href = domainResult.data.domain;
          } else {
            // Fallback to dashboard if no company domain found
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error getting company domain:', error);
          // Fallback to dashboard
          router.push('/dashboard');
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-black">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-1 border-gray-300 focus:border-black focus:ring-black"
            placeholder="tu@email.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-black">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="mt-1 border-gray-300 focus:border-black focus:ring-black"
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black hover:bg-gray-800 text-white"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Iniciando sesión...</span>
          </div>
        ) : (
          'Iniciar Sesión'
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/" className="text-black hover:underline font-medium">
            Crear Usuario
          </Link>
        </p>
      </div>
    </form>
  );
}
