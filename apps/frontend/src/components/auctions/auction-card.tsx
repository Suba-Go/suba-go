'use client';

import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { Clock, Users, Car, MoreVertical, Edit } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Button } from '@suba-go/shared-components/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@suba-go/shared-components/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@suba-go/shared-components/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getAuctionBadgeColor,
  getAuctionStatusLabel,
} from '@/lib/auction-badge-colors';
import { useAuctionStatus } from '@/hooks/use-auction-status';
import {
  AuctionDto,
  AuctionItemWithItmeAndBidsDto,
  AuctionTypeEnum,
  BidDto,
} from '@suba-go/shared-validation';
import { useFetchData } from '@/hooks/use-fetch-data';

function getPrimaryPhoto(photos?: string | null): string | null {
  if (!photos) return null;
  const raw = photos.trim();
  if (!raw) return null;

  // Supports either JSON array string or comma-separated list
  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = String(parsed[0] ?? '').trim();
        return url || null;
      }
    }
  } catch {
    // ignore
  }

  const first = raw.split(',')[0]?.trim();
  return first || null;
}

interface AuctionCardProps {
  auction: AuctionDto | any; // accepts AuctionWithItemsAndBidsDto as well
  onUpdate: () => void;
  onEdit?: (auction: AuctionCardProps['auction']) => void;
  /**
   * Optional server-synced clock.
   * When provided, the card won't create its own interval and will instead
   * render using this shared, server-aligned clock.
   */
  clock?: {
    nowMs: number;
    serverOffsetMs?: number;
    tickMs?: number;
  };
  /**
   * Responsive image sizes string for Next/Image.
   * Pass per-view to avoid requesting an image that's too small (blurry)
   * or too large (wasted bandwidth).
   */
  imageSizes?: string;
  /**
   * Next/Image quality (0-100). Defaults to 82 for a good balance.
   */
  imageQuality?: number;
}

export function AuctionCard({
  auction,
  onUpdate,
  onEdit,
  clock,
  imageSizes,
  imageQuality,
}: AuctionCardProps) {
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  // Use automatic status hook
  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auction.endTime,
    clock
      ? {
          nowMs: clock.nowMs,
          serverOffsetMs: clock.serverOffsetMs,
          tickMs: clock.tickMs,
        }
      : undefined
  );
  const showActionsMenu = auctionStatus.isCompleted || auctionStatus.isPending;


  // If auctions were fetched with their items (e.g. dashboard), avoid N+1 requests.
  const preloadedItems = (auction as any)?.items as
    | AuctionItemWithItmeAndBidsDto[]
    | null
    | undefined;
  const shouldFetchItems = !preloadedItems;

  const { data: fetchedItems } = useFetchData<AuctionItemWithItmeAndBidsDto[]>({
    url: `/api/auction-items/${auction.id}`,
    key: ['auctionItems', auction.id],
    revalidateOnMount: true,
    condition: shouldFetchItems,
  });

  const auctionItems = preloadedItems ?? fetchedItems;

  const coverImage = useMemo(() => {
    const firstItem = auctionItems?.[0]?.item;
    const url = getPrimaryPhoto(firstItem?.photos as any);
    return url || '/placeholder-car.png';
  }, [auctionItems]);

  const getStatusBadge = () => {
    return (
      <Badge className={getAuctionBadgeColor(auctionStatus.displayStatus)}>
        {getAuctionStatusLabel(auctionStatus.displayStatus)}
      </Badge>
    );
  };

  const getTimeDisplay = () => {
    if (auctionStatus.isPending && auctionStatus.timeRemaining) {
      return `Inicia en ${auctionStatus.timeRemaining}`;
    }
    if (auctionStatus.isActive && auctionStatus.timeRemaining) {
      return `Termina en ${auctionStatus.timeRemaining}`;
    }
    if (auctionStatus.isCompleted) {
      return `Terminó ${formatDistanceToNow(endTime, {
        addSuffix: true,
        locale: es,
      })}`;
    }
    if (auctionStatus.isCanceled) {
      return 'Cancelada';
    }
    return '';
  };

  const totalItems = auctionItems?.length || 0;
  const totalBids =
    auctionItems?.reduce((sum, item) => sum + (item.bids?.length || 0), 0) || 0;
  const highestBid =
    auctionItems?.reduce((max, item) => {
      const itemMax =
        item.bids?.reduce(
          (itemMax, bid: BidDto) =>
            Math.max(itemMax, Number(bid.offered_price) || 0),
          0
        ) || 0;
      return Math.max(max, itemMax);
    }, 0) || 0;

  const handleAction = async (action: string) => {
    // Check if auction is completed
    if (auctionStatus.isCompleted) {
      setShowCompletedDialog(true);
      return;
    }

    if (action === 'edit' && onEdit) {
      onEdit(auction);
      return;
    }

    try {
      // TODO: Implement other auction actions (etc.)
      onUpdate();
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Product preview (main image) */}
      <div className="relative aspect-video w-full bg-gray-100">
        <SafeImage
          src={coverImage}
          alt={auction.title || 'Subasta'}
          fill
          className="object-cover"
          sizes={
            imageSizes ??
            '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          }
          quality={imageQuality ?? 82}
          priority={false}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{auction.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {auction.description || 'Sin descripción'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {auction.type === AuctionTypeEnum.TEST && (
              <Badge className="text-xs bg-orange-100 text-orange-600">
                Prueba
              </Badge>
            )}
            {showActionsMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('edit')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Information */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          {getTimeDisplay()}
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Car className="h-3 w-3" />
              Items
            </div>
            <div className="font-semibold">{totalItems}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Users className="h-3 w-3" />
              Pujas
            </div>
            <div className="font-semibold">{totalBids}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 mb-1">Puja Máx.</div>
            <div className="font-semibold">
              ${highestBid.toLocaleString('es-CL')}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="text-xs text-gray-500 space-y-1 pb-4">
          <div>
            Inicio: {format(startTime, 'dd/MM/yyyy HH:mm', { locale: es })}
          </div>
          <div>Fin: {format(endTime, 'dd/MM/yyyy HH:mm', { locale: es })}</div>
        </div>

        {/* Action Button */}
        <Link href={`/subastas/${auction.id}`}>
          <Button
            className="w-full"
            variant={auctionStatus.isActive ? 'default' : 'outline'}
            style={
              auctionStatus.isActive && primaryColor
                ? {
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#ffffff',
                  }
                : undefined
            }
            onMouseEnter={(e) => {
              if (auctionStatus.isActive && primaryColor) {
                e.currentTarget.style.backgroundColor = darkenColor(
                  primaryColor,
                  10
                );
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (auctionStatus.isActive && primaryColor) {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.color = '#ffffff';
              }
            }}
          >
            {auctionStatus.isActive ? 'Ver Subasta Activa' : 'Ver Detalles'}
          </Button>
        </Link>
      </CardContent>

      {/* Dialog for completed auctions */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subasta Completada</DialogTitle>
            <DialogDescription>
              Una subasta completada no puede ser editada, cancelada o
              eliminada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowCompletedDialog(false)}
              className="text-white"
              style={
                primaryColor
                  ? {
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (primaryColor) {
                  e.currentTarget.style.backgroundColor = darkenColor(
                    primaryColor,
                    10
                  );
                }
              }}
              onMouseLeave={(e) => {
                if (primaryColor) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
