export const AuctionTypeEnum = {
  TEST: 'TEST',
  REAL: 'REAL',
} as const;

export type AuctionTypeEnum =
  (typeof AuctionTypeEnum)[keyof typeof AuctionTypeEnum];

export const AuctionStatusEnum = {
  PENDIENTE: 'PENDIENTE',
  ACTIVA: 'ACTIVA',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  ELIMINADA: 'ELIMINADA',
} as const;

export type AuctionStatusEnum =
  (typeof AuctionStatusEnum)[keyof typeof AuctionStatusEnum];
