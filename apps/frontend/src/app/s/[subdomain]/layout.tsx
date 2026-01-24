import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { getCompanyBySubdomainServerAction } from '@/domain/server-actions/company/get-company-by-subdomain-server-action';
import { normalizeCompanyName } from '@/utils/company-normalization';
import ConditionalNavbar from '@/components/subdomain/conditional-navbar';
import { CompanyProvider } from '@/contexts/company-context';

function hexToRgbTriplet(hex: string): string {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return '236 194 24'; // default #ECC218
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '236 194 24';
  return `${r} ${g} ${b}`;
}

function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function lightenHex(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const p = percent / 100;
  const nr = clamp255(r + (255 - r) * p);
  const ng = clamp255(g + (255 - g) * p);
  const nb = clamp255(b + (255 - b) * p);
  return `#${nr.toString(16).padStart(2, '0')}${ng
    .toString(16)
    .padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const p = percent / 100;
  const nr = clamp255(r * (1 - p));
  const ng = clamp255(g * (1 - p));
  const nb = clamp255(b * (1 - p));
  return `#${nr.toString(16).padStart(2, '0')}${ng
    .toString(16)
    .padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function getReadableForeground(hex: string): '#FFFFFF' | '#16191b' {
  // Choose white/near-black based on relative luminance
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return '#16191b';
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L < 0.5 ? '#FFFFFF' : '#16191b';
}

interface SubdomainLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    subdomain: string;
  }>;
}

export async function generateMetadata({
  params,
}: SubdomainLayoutProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const normalizedSubdomain = normalizeCompanyName(resolvedParams.subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
    );

    if (companyResponse.success && companyResponse.data) {
      const company = companyResponse.data;

      // Use company logo if available, otherwise fallback to logo-white.png
      const faviconUrl = company.logo || '/logo-white.png';

      return {
        title: company.name,
        description: `Página de ${company.name}`,
        icons: [{ rel: 'icon', url: faviconUrl }],
      };
    }

    return {
      title: 'Empresa',
      description: 'Página de empresa',
      icons: [{ rel: 'icon', url: '/logo-white.png' }],
    };
  } catch {
    return {
      title: 'Empresa',
      description: 'Página de empresa',
      icons: [{ rel: 'icon', url: '/logo-white.png' }],
    };
  }
}

export default async function SubdomainLayout({
  children,
  params,
}: SubdomainLayoutProps) {
  let company;
  let subdomain;

  try {
    const resolvedParams = await params;
    subdomain = resolvedParams.subdomain;
    const normalizedSubdomain = normalizeCompanyName(subdomain);
    const companyResponse = await getCompanyBySubdomainServerAction(
      normalizedSubdomain
    );

    if (!companyResponse.success || !companyResponse.data) {
      console.error('Company not found:', companyResponse.error);
      notFound();
    }

    company = companyResponse.data;
  } catch (error) {
    console.error('Error fetching company:', error);
    notFound();
  }

  const brand = company.principal_color ?? '#ECC218';
  const brandLight = lightenHex(brand, 16);
  const brandDark = darkenHex(brand, 12);
  const brandForeground = getReadableForeground(brand);
  const brandRgb = hexToRgbTriplet(brand);

  const themeVars: CSSProperties = {
    // Brand variables available for all pages/components under this subdomain
    // Use these via: var(--company-primary), rgba(var(--company-primary-rgb), <alpha>), etc.
    ['--company-primary' as any]: brand,
    ['--company-primary-light' as any]: brandLight,
    ['--company-primary-dark' as any]: brandDark,
    ['--company-primary-foreground' as any]: brandForeground,
    ['--company-primary-rgb' as any]: brandRgb,
  };

  return (
    <div
      className="min-h-screen bg-gray-50 relative company-theme"
      style={
        {
          ...(company.background_logo_enabled && company.logo
            ? {
                backgroundImage: `url(${company.logo})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
                backgroundSize: '40%',
                backgroundAttachment: 'fixed',
              }
            : {}),
          ...themeVars,
        } as CSSProperties
      }
    >
      <CompanyProvider
        value={{
          company: {
            ...company,
            logo: company.logo ?? undefined,
            principal_color: company.principal_color ?? undefined,
            principal_color2: company.principal_color2 ?? undefined,
            secondary_color: company.secondary_color ?? undefined,
            secondary_color2: company.secondary_color2 ?? undefined,
            secondary_color3: company.secondary_color3 ?? undefined,
            tenantId: company.tenantId ?? '',
          },
          isLoading: false,
          error: null,
        }}
      >
        {/* Overlay to make background logo more subtle */}
        {company.background_logo_enabled && company.logo && (
          <div className="fixed inset-0 bg-gray-50/90 pointer-events-none z-0" />
        )}

        {/* Content wrapper with higher z-index */}
        <div className="relative z-10">
          {/* Company Navbar - Conditionally included (not in login) */}
          <ConditionalNavbar company={company} />

          {/* Page content */}
          {children}
        </div>
      </CompanyProvider>
    </div>
  );
}
