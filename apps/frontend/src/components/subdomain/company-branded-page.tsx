'use client';

import { CompanyDto } from '@suba-go/shared-validation';

interface CompanyBrandedPageProps {
  company: CompanyDto;
  subdomain?: string;
}

export default function CompanyBrandedPage({
  company,
}: CompanyBrandedPageProps) {
  const primaryColor = company.principal_color || '#3B82F6'; // Default blue if no color set

  return (
    <div
      className="min-h-screen"
      style={
        {
          '--primary-color': primaryColor,
          '--primary-color-rgb': hexToRgb(primaryColor),
        } as React.CSSProperties
      }
    >
      {/* Custom CSS variables for the company colors */}
      <style jsx>{`
        :root {
          --company-primary: ${primaryColor};
          --company-primary-light: ${lightenColor(primaryColor, 20)};
          --company-primary-dark: ${darkenColor(primaryColor, 20)};
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            Bienvenido a {company.name}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Esta es la página personalizada de {company.name}
          </p>

          {/* Company branding section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div
              className="p-6 rounded-lg border-2"
              style={{ borderColor: primaryColor }}
            >
              <h3 className="text-lg font-semibold mb-2">Nuestros Servicios</h3>
              <p className="text-gray-600">
                Descubre todo lo que {company.name} tiene para ofrecerte.
              </p>
            </div>

            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <h3 className="text-lg font-semibold mb-2">Sobre Nosotros</h3>
              <p className="text-gray-600">
                Conoce más sobre la historia y valores de {company.name}.
              </p>
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ borderColor: primaryColor }}
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
