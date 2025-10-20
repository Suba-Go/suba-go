import { AuctionStatusEnum } from '@suba-go/shared-validation';

/**
 * Get the badge color classes for an auction status
 * @param status - The auction status
 * @returns Tailwind CSS classes for the badge
 */
export function getAuctionBadgeColor(status: string): string {
  switch (status) {
    case AuctionStatusEnum.PENDIENTE:
      return 'bg-primary text-primary-foreground'; // Primary (yellow)
    case AuctionStatusEnum.ACTIVA:
      return 'bg-green-600 text-white hover:bg-green-700'; // Green
    case AuctionStatusEnum.COMPLETADA:
      return 'bg-blue-600 text-white hover:bg-blue-700'; // Blue
    case AuctionStatusEnum.CANCELADA:
      return 'bg-orange-600 text-white hover:bg-orange-700'; // Orange
    case AuctionStatusEnum.ELIMINADA:
      return 'bg-red-600 text-white hover:bg-red-700'; // Red
    default:
      return 'bg-gray-600 text-white hover:bg-gray-700'; // Default gray
  }
}

/**
 * Get the badge label for an auction status
 * @param status - The auction status
 * @returns Spanish label for the status
 */
export function getAuctionStatusLabel(status: string): string {
  switch (status) {
    case AuctionStatusEnum.PENDIENTE:
      return 'Pendiente';
    case AuctionStatusEnum.ACTIVA:
      return 'Activa';
    case AuctionStatusEnum.COMPLETADA:
      return 'Completada';
    case AuctionStatusEnum.CANCELADA:
      return 'Cancelada';
    case AuctionStatusEnum.ELIMINADA:
      return 'Eliminada';
    default:
      return status;
  }
}

