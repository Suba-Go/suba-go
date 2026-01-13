'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UsersTable } from '@/components/users/users-table';
import {
  PercentIcon,
  TrendingUpIcon,
  DollarSignIcon,
  GavelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useCompanyContextOptional } from '@/contexts/company-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import { Button } from '@suba-go/shared-components/components/ui/button';

type AuctionItem = {
  id: string;
  startingBid?: number | null;
  bids?: Array<{ offered_price: number }>;
  item?: { soldPrice?: number | null };
};

type Auction = {
  id: string;
  title: string;
  status: 'PENDIENTE' | 'ACTIVA' | 'CANCELADA' | 'COMPLETADA' | 'ELIMINADA';
  startTime: string;
  endTime: string;
  items?: AuctionItem[];
};

export default function ManagerStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);

  // Filters and Pagination State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<string>('ALL_TIME');
  const itemsPerPage = 10;

  // Get company context
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color || '#3B82F6';

  // ... useEffects ...
  useEffect(() => {
    if (status === 'loading') return;

    if (
      !session ||
      (session.user.role !== 'AUCTION_MANAGER' && session.user.role !== 'ADMIN')
    ) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    (async () => {
      try {
        const auctionsRes = await fetch('/api/auctions');
        const auctionsData = await auctionsRes.json();

        if (!auctionsRes.ok) {
          toast({
            title: 'Error',
            description:
              auctionsData?.error || 'No se pudieron obtener las subastas',
            duration: 3000,
          });
        } else {
          setAuctions(
            Array.isArray(auctionsData) ? (auctionsData as Auction[]) : []
          );
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Error al cargar datos',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [status, toast]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, timeFilter]);

  const computed = useMemo(() => {
    // 0. Filter Auctions first (Time & Status)
    const filteredAuctions = auctions.filter((a) => {
      // 1. Time Filter
      const auctionDate = new Date(a.startTime); // Use startTime for filtering
      const now = new Date();
      let matchesTime = true;

      if (timeFilter === 'LAST_MONTH') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        matchesTime = auctionDate >= oneMonthAgo && auctionDate <= now;
      } else if (timeFilter === 'LAST_3_MONTHS') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        matchesTime = auctionDate >= threeMonthsAgo && auctionDate <= now;
      } else if (timeFilter === 'LAST_6_MONTHS') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        matchesTime = auctionDate >= sixMonthsAgo && auctionDate <= now;
      } else if (timeFilter === 'LAST_YEAR') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        matchesTime = auctionDate >= oneYearAgo && auctionDate <= now;
      }
      // 'ALL_TIME' matches everything by default

      if (!matchesTime) return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;

      return true;
    });

    // 1. Auction Award Rate (per auction)
    const auctionStats = filteredAuctions.map((a) => {
      // Don't count awarded items for canceled auctions
      if (a.status === 'CANCELADA') {
        return {
          ...a,
          totalItems: a.items?.length || 0,
          awardedItems: 0,
          awardRate: 0,
          avgMargin: 0,
        };
      }

      const totalItems = a.items?.length || 0;
      const awardedItems =
        a.items?.filter(
          (i) => i.item?.soldPrice !== null && i.item?.soldPrice !== undefined
        ).length || 0;
      const awardRate = totalItems > 0 ? (awardedItems / totalItems) * 100 : 0;

      // Calculate margin per auction
      let auctionMarginTotal = 0;
      let auctionSoldCount = 0;
      a.items?.forEach((i) => {
        if (i.item?.soldPrice && i.startingBid) {
          const sold = Number(i.item.soldPrice);
          const start = Number(i.startingBid);
          if (start > 0) {
            auctionMarginTotal += sold / start - 1;
            auctionSoldCount++;
          }
        }
      });
      const avgMargin =
        auctionSoldCount > 0
          ? (auctionMarginTotal / auctionSoldCount) * 100
          : 0;

      return { ...a, totalItems, awardedItems, awardRate, avgMargin };
    });

    // Pagination logic
    const totalPages = Math.ceil(auctionStats.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAuctions = auctionStats.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    // 2. Global Item Stats
    let totalDiff = 0;
    let totalMargin = 0;
    let soldItemsCount = 0;
    let totalBids = 0;
    let totalItemsGlobal = 0;

    // Use filteredAuctions for global stats to respect the time/status filters
    filteredAuctions.forEach((a) => {
      if (a.status === 'CANCELADA') return;

      (a.items || []).forEach((i) => {
        totalItemsGlobal++;
        totalBids += i.bids?.length || 0;

        if (i.item?.soldPrice && i.startingBid) {
          const sold = Number(i.item.soldPrice);
          const start = Number(i.startingBid);

          if (start > 0) {
            totalDiff += sold - start;
            totalMargin += sold / start - 1;
            soldItemsCount++;
          }
        }
      });
    });

    const avgPriceDiff = soldItemsCount > 0 ? totalDiff / soldItemsCount : 0;
    const avgMargin =
      soldItemsCount > 0 ? (totalMargin / soldItemsCount) * 100 : 0;
    const avgBidsPerItem =
      totalItemsGlobal > 0 ? totalBids / totalItemsGlobal : 0;

    return {
      paginatedAuctions, // Use this for table
      totalPages,
      totalCount: auctionStats.length,
      avgPriceDiff,
      avgMargin,
      avgBidsPerItem,
    };
  }, [auctions, statusFilter, timeFilter, currentPage]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
        Panel de Estadísticas
      </h1>

      {/* Global Item Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Estadísticas Globales de Items
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dif. Precio Promedio (Final - Inicial)
              </CardTitle>
              <DollarSignIcon
                className="h-4 w-4"
                style={{ color: primaryColor }}
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                ${Math.round(computed.avgPriceDiff).toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-gray-500">
                Promedio en items vendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Margen Promedio
              </CardTitle>
              <TrendingUpIcon
                className="h-4 w-4"
                style={{ color: primaryColor }}
              />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                {computed.avgMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">Sobre precio inicial</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pujas Promedio por Item
              </CardTitle>
              <GavelIcon className="h-4 w-4" style={{ color: primaryColor }} />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                {computed.avgBidsPerItem.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500">Interacción promedio</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auction Stats Table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Rendimiento por Subasta
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-[200px]">
              <Select
                value={timeFilter}
                onValueChange={(val) => setTimeFilter(val)}
              >
                <SelectTrigger
                  style={
                    {
                      '--ring-color': primaryColor,
                      '--border-color': primaryColor,
                    } as React.CSSProperties
                  }
                >
                  <SelectValue placeholder="Filtrar por tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAST_MONTH">Último mes</SelectItem>
                  <SelectItem value="LAST_3_MONTHS">Últimos 3 meses</SelectItem>
                  <SelectItem value="LAST_6_MONTHS">Últimos 6 meses</SelectItem>
                  <SelectItem value="LAST_YEAR">Último año</SelectItem>
                  <SelectItem value="ALL_TIME">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
              >
                <SelectTrigger
                  style={
                    {
                      '--ring-color': primaryColor,
                      '--border-color': primaryColor,
                    } as React.CSSProperties
                  }
                >
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="ACTIVA">Activa</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Subasta</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Items Total</th>
                  <th className="px-4 py-3 text-center">Adjudicados</th>
                  <th className="px-4 py-3 text-center">Margen Prom.</th>
                  <th className="px-4 py-3 text-right">Tasa Adjudicación</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {computed.paginatedAuctions.map((auction) => (
                  <tr key={auction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/subastas/${auction.id}`}
                        className="hover:underline"
                        style={{ color: primaryColor }}
                      >
                        {auction.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          auction.status === 'ACTIVA'
                            ? 'bg-green-100 text-green-800'
                            : auction.status === 'COMPLETADA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {auction.totalItems}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {auction.awardedItems}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-600">
                      {auction.status !== 'CANCELADA' &&
                      auction.awardedItems > 0
                        ? `${auction.avgMargin.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <div className="flex items-center justify-end gap-2">
                        <span>{auction.awardRate.toFixed(0)}%</span>
                        <PercentIcon className="h-3 w-3 text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
                {computed.paginatedAuctions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No se encontraron subastas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {computed.paginatedAuctions.length} de{' '}
              {computed.totalCount} subastas
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {Math.max(1, computed.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(computed.totalPages, p + 1))
                }
                disabled={currentPage >= computed.totalPages}
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* User Stats Section */}
      <section className="space-y-6 pt-4 border-t">
        <h2 className="text-xl font-semibold text-gray-700">
          Estadísticas de Usuarios
        </h2>
        <UsersTable />
      </section>
    </div>
  );
}
