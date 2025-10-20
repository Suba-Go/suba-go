'use client';

import Link from 'next/link';
import { Clock, Users, Car, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

interface AuctionCardProps {
  auction: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    status: string;
    type?: string;
    items?: Array<{
      id: string;
      item: {
        id: string;
        plate?: string;
        brand?: string;
        model?: string;
      };
      bids: Array<{ offered_price: number }>;
    }>;
  };
  subdomain: string;
  onUpdate: () => void;
  onEdit?: (auction: AuctionCardProps['auction']) => void;
}

export function AuctionCard({
  auction,
  subdomain,
  onUpdate,
  onEdit,
}: AuctionCardProps) {
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  // Use automatic status hook
  const auctionStatus = useAuctionStatus(
    auction.status,
    auction.startTime,
    auction.endTime
  );

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

  const totalItems = auction.items?.length || 0;
  const totalBids =
    auction.items?.reduce((sum, item) => sum + item.bids.length, 0) || 0;
  const highestBid =
    auction.items?.reduce((max, item) => {
      const itemMax = item.bids.reduce(
        (itemMax, bid) => Math.max(itemMax, bid.offered_price),
        0
      );
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
      // TODO: Implement other auction actions (delete, etc.)
      onUpdate();
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {auctionStatus.isCompleted ? (
                  <DropdownMenuItem onClick={() => handleAction('edit')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                ) : (
                  <>
                    {auctionStatus.isPending && (
                      <DropdownMenuItem onClick={() => handleAction('edit')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            Inicio: {format(startTime, 'dd/mm/yyyy HH:mm', { locale: es })}
          </div>
          <div>Fin: {format(endTime, 'dd/mm/yyyy HH:mm', { locale: es })}</div>
        </div>

        {/* Action Button */}
        <Link href={`/subastas/${auction.id}`}>
          <Button
            className="w-full"
            variant={auctionStatus.isActive ? 'default' : 'outline'}
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
            <Button onClick={() => setShowCompletedDialog(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
