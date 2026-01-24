'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Label } from '@suba-go/shared-components/components/ui/label';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { getNodeEnv } from '@suba-go/shared-components';
import { normalizeCompanyName } from '@/utils/company-normalization';
import { Eye, EyeOff } from 'lucide-react';

interface CompanyLoginFormProps {
  companyName?: string;
  companyNameLowercase?: string;
  prefilledEmail?: string;
  onLoginSuccess?: () => void;
}

export default function CompanyLoginForm({
  companyName,
  companyNameLowercase,
  prefilledEmail,
  onLoginSuccess,
}: CompanyLoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: prefilledEmail || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const { toast } = useToast();

  // Update email if prefilledEmail changes
  useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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
    // Use the normalized company name for subdomain validation
    const subdomainToValidate =
      companyNameLowercase || normalizeCompanyName(companyName || '');

    // SECURITY: Validate that the email belongs to this tenant before attempting login
    if (subdomainToValidate) {
      try {
        const validationResponse = await fetch(
          `/api/users/validate-email-for-tenant?email=${encodeURIComponent(
            formData.email
          )}&subdomain=${encodeURIComponent(subdomainToValidate)}`
        );

        if (validationResponse.ok) {
          const validationData = await validationResponse.json();
          // Check if the validation was successful and the email is valid
          if (validationData.success && validationData.data) {
            if (!validationData.data.isValid) {
              toast({
                title: 'Acceso denegado',
                description:
                  validationData.data.message ||
                  'Este email no pertenece a esta empresa',
                variant: 'destructive',
              });
              setIsLoading(false);
              return;
            }
          } else {
            // Handle case where validation data structure is unexpected
            toast({
              title: 'Error de validación',
              description: 'Error al validar el email',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } else {
          // If validation fails, show error and stop login
          toast({
            title: 'Error de validación',
            description: 'No se pudo validar el acceso a esta empresa',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Email validation error:', error);
        toast({
          title: 'Error de validación',
          description: 'No se pudo validar el acceso a esta empresa',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Clear any existing session cookies before login
    // NOTE: We clear both legacy Auth.js cookie names and NextAuth v5 cookie names
    // to avoid stale callback-url/session tokens causing unexpected redirects.
    if (getNodeEnv() === 'local') {
      // Clear cookies for both localhost and .localhost domain
      const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      const base = `${expire} path=/;`;
      const baseDomain = `${expire} path=/; domain=.localhost;`;

      const cookieNames = [
        // Auth.js legacy
        'authjs.session-token',
        'authjs.csrf-token',
        'authjs.callback-url',
        // NextAuth (common)
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        // Secure variants
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.callback-url',
        '__Host-next-auth.csrf-token',
      ];

      for (const name of cookieNames) {
        document.cookie = `${name}=; ${base}`;
        document.cookie = `${name}=; ${baseDomain}`;
      }
    }

    try {
      // Force a deterministic post-login landing, independent of any stale callback-url cookie.
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setIsLoading(false);
        toast({
          title: 'Error de autenticación',
          description: 'Email o contraseña incorrectos',
          variant: 'destructive',
          duration: 3000,
        });
      } else if (result?.ok) {
        // Wait for session to be established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fetch the session to check if profile is complete
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();

        // Check if profile is complete
        const user = session?.user;
        const isProfileComplete =
          user?.name &&
          user.name.trim().length >= 3 &&
          user.phone &&
          user.phone.trim().length > 0 &&
          user.rut &&
          user.rut.trim().length > 0;

        // Role-based landing:
        // - AUCTION_MANAGER / ADMIN -> Estadisticas
        // - USER -> Home
        const role = user?.role;
        const landingPath =
          role === 'AUCTION_MANAGER' || role === 'ADMIN'
            ? '/estadisticas'
            : '/';

        // Keep loading state true during redirect to show clear feedback
        if (onLoginSuccess) {
          onLoginSuccess();
          // Don't set isLoading to false - let it stay loading during redirect
        } else {
          // Redirect based on profile completion status
          // Keep isLoading true to show loading state during redirect
          if (isProfileComplete) {
            router.replace(landingPath);
          } else {
            router.replace('/onboarding');
          }
          // Don't set isLoading to false - let it stay loading during redirect
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Ocurrió un error durante el inicio de sesión',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange =
    (field: 'email' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: undefined });
      }
    };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {companyName ? `Bienvenido a ${companyName}` : 'Iniciar Sesión'}
        </h1>
        <p className="text-gray-600">Ingresa tu contraseña para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={errors.email ? 'border-red-500' : ''}
            disabled={isLoading || !!prefilledEmail} // Disable if prefilled
            autoFocus={!formData.email.trim()}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={handleInputChange('password')}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              disabled={isLoading}
              autoFocus={!!formData.email.trim()}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !formData.email.trim() || !formData.password}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-3">
        <div className="border-t border-gray-200 pt-3">
          <a
            href={
              getNodeEnv() === 'local'
                ? 'http://localhost:3000/login'
                : getNodeEnv() === 'development'
                ? 'https://development.subago.cl/login'
                : `https://${
                    process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'subago.cl'
                  }/login`
            }
            className="text-sm text-default hover:underline font-medium"
          >
            ← Volver al login principal
          </a>
        </div>
      </div>
    </div>
  );
}
