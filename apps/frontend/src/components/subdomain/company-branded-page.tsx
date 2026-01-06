'use client';

import { useEffect } from 'react';
import { CompanyDto } from '@suba-go/shared-validation';
import { useSession } from 'next-auth/react';
import UserHomePage from './user-home-page';
import { useRouter } from 'next/navigation';

interface CompanyBrandedPageProps {
  company: CompanyDto;
}

export default function CompanyBrandedPage({
  company,
}: CompanyBrandedPageProps) {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter();

  // Redirect AUCTION_MANAGER to /subastas using useEffect to avoid render-time navigation
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    if (session && userRole === 'AUCTION_MANAGER') {
      router.push('/subastas');
    }
    // Note: If not logged in, middleware will handle redirect to /login
    // We don't need to redirect here to avoid conflicts
  }, [session, userRole, status, router]);

  // If user is logged in and is a regular USER, show the user home page
  if (session && userRole === 'USER') {
    return <UserHomePage />;
  }

  // For AUCTION_MANAGER or not logged in, show "under development" page
  return (
    <div
      className="min-h-screen relative"
      style={
        {
          '--primary-color': company.principal_color,
          '--primary-color-rgb': hexToRgb(company.principal_color ?? '#3B82F6'),
        } as React.CSSProperties
      }
    >
      {/* Background logo if enabled */}
      {company.background_logo_enabled && company.logo && (
        <div
          className="absolute inset-0 bg-repeat opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url(${company.logo})`,
            backgroundSize: '200px 200px',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Custom CSS variables for the company colors */}
      <style jsx>{`
        :root {
          --company-primary: ${company.principal_color};
          --company-primary-light: ${lightenColor(
            company.principal_color ?? '#3B82F6',
            20
          )};
          --company-primary-dark: ${darkenColor(
            company.principal_color ?? '#3B82F6',
            20
          )};
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center">
          {/* Company logo */}
          {company.logo && !company.background_logo_enabled && (
            <div className="mb-6 flex justify-center">
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="h-24 object-contain"
              />
            </div>
          )}

          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: company.principal_color ?? '#3B82F6' }}
          >
            Bienvenido a {company.name}
          </h2>

          <p className="text-xl text-gray-600 mb-8">
            {userRole === 'AUCTION_MANAGER'
              ? 'Página en desarrollo para administradores'
              : 'Esta es la página personalizada de ' + company.name}
          </p>

          {/* Company branding section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div
              className="p-6 rounded-lg border-2"
              style={{ borderColor: company.principal_color ?? '#3B82F6' }}
            >
              <h3 className="text-lg font-semibold mb-2">Nuestros Servicios</h3>
              <p className="text-gray-600">
                Descubre todo lo que {company.name} tiene para ofrecerte.
              </p>
            </div>

            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: `${company.principal_color ?? '#3B82F6'}15`,
              }}
            >
              <h3 className="text-lg font-semibold mb-2">Sobre Nosotros</h3>
              <p className="text-gray-600">
                Conoce más sobre la historia y valores de {company.name}.
              </p>
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ borderColor: company.principal_color ?? '#3B82F6' }}
            >
              <h3 className="text-lg font-semibold mb-2">Contacto</h3>
              <p className="text-gray-600">
                Ponte en contacto con nuestro equipo de {company.name}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for color manipulation
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '59, 130, 246'; // Default blue RGB

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;

  return (
    '#' +
    (
      0x1000000 +
      (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)
  );
}
