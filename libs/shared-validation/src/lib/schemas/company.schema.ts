import { z } from 'zod';
import { name } from './main.schema';
import { baseSchema } from './base.schema';
import { tenantSchema } from './tenant.schema';

// -----------------------------------------------------------------------------
// Business rule: avoid principal colors too close to white.
//
// We validate this in shared-validation so it applies both in frontend (via
// zodResolver) and backend (TRPC input validation). This prevents edge cases
// where a near-white/pastel primary color makes text unreadable.
//
// Rule: block any color whose contrast ratio with white is < 4.5:1 (WCAG AA for
// normal text). This catches whites, near-white grays, and very light pastels.
// -----------------------------------------------------------------------------

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const parseColorToRgb = (
  value?: string | null
): { r: number; g: number; b: number } | null => {
  if (!value) return null;
  const v = value.trim().toLowerCase();

  // Hex: #rgb or #rrggbb
  if (v.startsWith('#')) {
    const hex = v.slice(1);
    const isShort = hex.length === 3;
    const isLong = hex.length === 6;
    if (!isShort && !isLong) return null;

    const full = isShort
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  // rgb(r,g,b)
  const rgbMatch = v.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return { r, g, b };
  }

  return null;
};

// WCAG relative luminance
const relativeLuminance = (rgb: { r: number; g: number; b: number }) => {
  const srgb = [rgb.r, rgb.g, rgb.b].map((v) => clamp01(v / 255));
  const lin = srgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};

const contrastRatioWithWhite = (rgb: { r: number; g: number; b: number }) => {
  const L = relativeLuminance(rgb);
  // White luminance is 1.0. White is always lighter than a brand color.
  return (1.0 + 0.05) / (L + 0.05);
};

const isDisallowedPrincipalColor = (value?: string | null) => {
  const rgb = parseColorToRgb(value);
  if (!rgb) return false;

  // Pure white
  if (rgb.r === 255 && rgb.g === 255 && rgb.b === 255) return true;

  // Contrast rule
  const ratio = contrastRatioWithWhite(rgb);
  return ratio < 4.5;
};

const PRINCIPAL_COLOR_TOO_LIGHT_MSG = 'No se puede asignar un color blanco';

export const companySchema = baseSchema
  .extend({
    name: name,
    nameLowercase: z.string(),
    logo: z.string().nullable().optional(),
    background_logo_enabled: z.boolean().optional().nullable(),
    principal_color: z.string().nullable().optional(),
    principal_color2: z.string().nullable().optional(),
    secondary_color: z.string().nullable().optional(),
    secondary_color2: z.string().nullable().optional(),
    secondary_color3: z.string().nullable().optional(),
    tenantId: z.uuid().nullable(),
  })
  .strict();

export const companyWithTenantSchema = companySchema.extend({
  get tenant() {
    return tenantSchema.nullable();
  },
});

export const companyCompactCreateSchema = companySchema.omit({
  id: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  nameLowercase: true,
  logo: true,
  principal_color2: true,
  secondary_color: true,
  secondary_color2: true,
  secondary_color3: true,
  tenantId: true,
}).superRefine((data, ctx) => {
  if (isDisallowedPrincipalColor(data.principal_color)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['principal_color'],
      message: PRINCIPAL_COLOR_TOO_LIGHT_MSG,
    });
  }
});

export const companyCreateSchema = companySchema
  .omit({
    id: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    logo: true,
    principal_color2: true,
    secondary_color: true,
    secondary_color2: true,
    secondary_color3: true,
    tenantId: true,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (isDisallowedPrincipalColor(data.principal_color)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['principal_color'],
        message: PRINCIPAL_COLOR_TOO_LIGHT_MSG,
      });
    }
  });

export type CompanyDto = z.infer<typeof companySchema>;
export type CompanyWithTenantDto = z.infer<typeof companyWithTenantSchema>;
export type CompanyCreateCompactDto = z.infer<
  typeof companyCompactCreateSchema
>;
export type CompanyCreateDto = z.infer<typeof companyCreateSchema>;

// Update schema allows partial updates
export const companyUpdateSchema = companySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    isDeleted: true,
    nameLowercase: true,
  })
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    // Only validate when the client is trying to change the color.
    if (typeof data.principal_color === 'undefined') return;
    if (isDisallowedPrincipalColor(data.principal_color)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['principal_color'],
        message: PRINCIPAL_COLOR_TOO_LIGHT_MSG,
      });
    }
  });

export type CompanyUpdateDto = z.infer<typeof companyUpdateSchema>;
