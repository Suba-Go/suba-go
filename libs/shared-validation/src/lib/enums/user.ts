export const UserRolesEnum = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  AUCTION_MANAGER: 'AUCTION_MANAGER',
} as const;

export type UserRolesEnum =
  (typeof UserRolesEnum)[keyof typeof UserRolesEnum];
