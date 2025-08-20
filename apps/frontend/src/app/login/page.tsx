import { Metadata } from 'next';
import GlobalLoginForm from '@/components/auth/global-login-form';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta para gestionar tu empresa.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <GlobalLoginForm />
      </div>
    </div>
  );
}
