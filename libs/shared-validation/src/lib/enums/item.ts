export const LegalStatusEnum = {
  TRANSFERIBLE: 'TRANSFERIBLE',
  LEASING: 'LEASING',
  POSIBILIDAD_DE_EMBARGO: 'POSIBILIDAD_DE_EMBARGO',
  PRENDA: 'PRENDA',
  OTRO: 'OTRO',
} as const;

export type LegalStatusEnum =
  (typeof LegalStatusEnum)[keyof typeof LegalStatusEnum];

export const ItemStateEnum = {
  DISPONIBLE: 'DISPONIBLE',
  VENDIDO: 'VENDIDO',
  EN_SUBASTA: 'EN_SUBASTA',
  ELIMINADO: 'ELIMINADO',
} as const;

export type ItemStateEnum =
  (typeof ItemStateEnum)[keyof typeof ItemStateEnum];

export const ShowItemStateEnum = {
  DISPONIBLE: 'Disponible',
  VENDIDO: 'Vendido',
  EN_SUBASTA: 'En subasta',
} as const;

export type ShowItemStateEnum =
  (typeof ShowItemStateEnum)[keyof typeof ShowItemStateEnum];
