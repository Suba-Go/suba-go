import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import Link from 'next/link';
import { getAuctionBadgeColor, getAuctionStatusLabel } from '@/lib/auction-badge-colors';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import { Progress } from '@suba-go/shared-components/components/ui/progress';

interface UserStatisticsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

interface UserStats {
  participationCount: number;
  participatedAuctions: {
    id: string;
    title: string;
    status: string;
    startTime: Date;
    endTime: Date;
    itemsWonCount: number;
  }[];
  averageBidsPerItem: number;
  winRate: number;
  secondPlaceRate: number;
  wonItems: {
    id: string;
    name: string;
    price: number | null;
    auctionId?: string;
  }[];
  biddingTrend: {
    day: string;
    count: number;
  }[];
}

export function UserStatisticsDialog({
  userId,
  open,
  onOpenChange,
  userName,
}: UserStatisticsDialogProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      setError(null);
      trpc.user.getStatistics
        .query({ userId })
        .then((response) => {
          if (response.success && response.data) {
            setStats(response.data as unknown as UserStats);
          } else {
            setError(response.error || 'Error al cargar estadísticas');
          }
        })
        .catch((err) => {
          setError(err.message || 'Error de conexión');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, userId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getProgressColorClass = (rate: number) => {
    // Reverse colors for "Tasa Autos Perdidos"
    if (rate < 30) return 'bg-red-500';
    if (rate < 70) return 'bg-amber-400';
    return 'bg-green-500';
  };

  const getLostRateColorClass = (rate: number) => {
    if (rate < 30) return 'bg-green-500';
    if (rate < 70) return 'bg-amber-400';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[810px] w-[95%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estadísticas de {userName}</DialogTitle>
          <DialogDescription>
            Resumen de actividad y participación en subastas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : stats ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Participaciones en subastas</p>
                <p className="text-2xl font-bold">{stats.participationCount}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Promedio de pujas por auto</p>
                <p className="text-2xl font-bold">
                  {stats.averageBidsPerItem}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center flex flex-col justify-center items-center">
                <p className="text-sm text-gray-500 mb-2">Win Rate</p>
                <div className="w-[80%] space-y-1">
                  <Progress
                    value={stats.winRate}
                    className="h-2 bg-gray-200"
                    indicatorClassName={getProgressColorClass(stats.winRate)}
                    showValuePoint
                  />
                  <p className="text-xs font-medium text-gray-900">
                    {stats.winRate}%
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center flex flex-col justify-center items-center">
                <p className="text-sm text-gray-500 mb-2">Tasa Autos Perdidos</p>
                <div className="w-[80%] space-y-1">
                  <Progress
                    value={stats.secondPlaceRate}
                    className="h-2 bg-gray-200"
                    indicatorClassName={getLostRateColorClass(stats.secondPlaceRate)}
                    showValuePoint
                  />
                  <p className="text-xs font-medium text-gray-900">
                    {stats.secondPlaceRate}%
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Tendencia de Pujas por Día
                </p>
                <div className="flex justify-between h-40 px-4 gap-2">
                  {stats.biddingTrend.map((day) => {
                    const maxBids = Math.max(
                      ...stats.biddingTrend.map((d) => d.count),
                      1
                    );
                    // Scale from 10% (for 0 bids) to 100% (for max bids)
                    const heightPercentage = (day.count / maxBids) * 90 + 10;
                    
                    return (
                      <div
                        key={day.day}
                        className="flex flex-col items-center flex-1 group relative justify-end"
                      >
                        <div className="w-full flex-1 flex items-end relative px-1">
                          <div
                            className="w-full bg-blue-600 rounded-t-sm hover:bg-blue-700 transition-all relative"
                            style={{
                              height: `${heightPercentage}%`,
                            }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                              {day.count} pujas
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          {day.day}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">
                Items Adjudicados ({stats.wonItems.length})
              </h3>
              {stats.wonItems.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {stats.wonItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 bg-white border rounded hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.price ? formatCurrency(item.price) : 'Sin precio'}
                        </p>
                      </div>
                      <Link
                        href={`/items/${item.id}`}
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                        >
                          Ver Auto
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No ha ganado items aún.
                </p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">
                Subastas Participadas ({stats.participatedAuctions.length})
              </h3>
              {stats.participatedAuctions.length > 0 ? (
                <div className="space-y-2 border rounded-md p-2">
                  {stats.participatedAuctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="flex justify-between items-center p-2 bg-white border rounded hover:bg-gray-50"
                    >
                      <div className="flex-1 mr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm line-clamp-1">
                            {auction.title}
                          </p>
                          <Badge
                            className={`text-[10px] px-1 py-0 h-4 ${getAuctionBadgeColor(
                              auction.status
                            )}`}
                          >
                            {getAuctionStatusLabel(auction.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(auction.startTime).toLocaleDateString()}
                        </p>
                        {auction.itemsWonCount >= 0 && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            {auction.itemsWonCount} items adjudicados por el usuario
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/subastas/${auction.id}`}
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                        >
                          Ver Subasta
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No ha participado en subastas.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

