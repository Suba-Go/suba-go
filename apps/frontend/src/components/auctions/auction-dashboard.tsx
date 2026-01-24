'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@suba-go/shared-components/components/ui/tabs';
import {
  AuctionDto,
  AuctionWithItemsAndBidsDto,
} from '@suba-go/shared-validation';
import { useFetchData } from '@/hooks/use-fetch-data';
import { darkenColor } from '@/utils/color-utils';
import { AuctionCard } from './auction-card';
import { AuctionCreateModal } from './auction-create-modal';
import { AuctionEditModal } from './auction-edit-modal';

interface AuctionDashboardProps {
  auctions: AuctionWithItemsAndBidsDto[];
  primaryColor?: string;
  isLoading: boolean;
  error: Error;
  subdomain: string;
}

// ✅ Fix: soporta Date o string (y null/undefined) para evitar TS2345
function toMs(v?: string | Date | null) {
  if (!v) return 0;
  const ms = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function AuctionDashboard({
  auctions,
  isLoading,
  primaryColor,
  error,
  subdomain,
}: AuctionDashboardProps) {
  const router = useRouter();

  type StatusFilter =
    | 'ALL'
    | 'PENDIENTE'
    | 'ACTIVA'
    | 'COMPLETADA'
    | 'CANCELADA'
    | 'ELIMINADA';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionDto | null>(
    null
  );

  // UX: controls
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<
    'START_DESC' | 'START_ASC' | 'END_DESC' | 'END_ASC' | 'TITLE_ASC'
  >('START_DESC');
  const [pageSize, setPageSize] = useState<6 | 9 | 12>(9);
  const [page, setPage] = useState(1);

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'ACTIVA', label: 'Activas' },
    { value: 'PENDIENTE', label: 'Pendientes' },
    { value: 'COMPLETADA', label: 'Completadas' },
    { value: 'CANCELADA', label: 'Canceladas' },
  ];

  // Fetch dashboard stats
  const { data: stats } = useFetchData<{
    totalAuctions: number;
    activeAuctions: number;
    totalParticipants: number;
    totalRevenue: number;
  }>({
    url: `/api/auctions/stats`,
    key: ['auction-stats', subdomain],
  });

  // Reset page when controls change
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortBy, pageSize]);

  const computed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (Array.isArray(auctions) ? auctions : []) as AuctionWithItemsAndBidsDto[];

    if (q.length > 0) {
      list = list.filter((a) => {
        const title = (a.title || '').toLowerCase();
        const desc = String((a as any).description || '').toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'TITLE_ASC') {
        return (a.title || '').localeCompare(b.title || '', 'es');
      }
      if (sortBy === 'START_ASC') return toMs(a.startTime as any) - toMs(b.startTime as any);
      if (sortBy === 'START_DESC') return toMs(b.startTime as any) - toMs(a.startTime as any);
      if (sortBy === 'END_ASC') return toMs(a.endTime as any) - toMs(b.endTime as any);
      return toMs(b.endTime as any) - toMs(a.endTime as any);
    });

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const pageItems = list.slice(startIdx, endIdx);

    return {
      total,
      totalPages,
      safePage,
      startIdx,
      endIdx,
      pageItems,
      hasFilters: Boolean(q) || statusFilter !== 'ALL',
    };
  }, [auctions, page, pageSize, query, sortBy, statusFilter]);

  const quickTabs: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'Todas' },
    { value: 'ACTIVA', label: 'Activas' },
    { value: 'PENDIENTE', label: 'Pendientes' },
    { value: 'COMPLETADA', label: 'Completadas' },
    { value: 'CANCELADA', label: 'Canceladas' },
  ];

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    const q = query.trim();
    if (q) {
      chips.push({
        key: 'q',
        label: `Buscar: “${q}”`,
        onClear: () => setQuery(''),
      });
    }

    if (statusFilter !== 'ALL') {
      chips.push({
        key: 'status',
        label: `Estado: ${statusFilter}`,
        onClear: () => setStatusFilter('ALL'),
      });
    }

    if (sortBy !== 'START_DESC') {
      const label =
        sortBy === 'START_ASC'
          ? 'Orden: Inicio (↑)'
          : sortBy === 'END_ASC'
            ? 'Orden: Fin (↑)'
            : sortBy === 'END_DESC'
              ? 'Orden: Fin (↓)'
              : 'Orden: Nombre (A–Z)';
      chips.push({
        key: 'sort',
        label,
        onClear: () => setSortBy('START_DESC'),
      });
    }

    if (pageSize !== 9) {
      chips.push({
        key: 'pageSize',
        label: `Por página: ${pageSize}`,
        onClear: () => setPageSize(9),
      });
    }

    return chips;
  }, [pageSize, query, sortBy, statusFilter]);

  const pageNumbers = useMemo(() => {
    const total = computed.totalPages;
    const current = computed.safePage;
    const out: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) out.push(i);
      return out;
    }

    // Always show: 1, last, and a window around current
    const windowSize = 2;
    const start = Math.max(2, current - windowSize);
    const end = Math.min(total - 1, current + windowSize);

    out.push(1);
    if (start > 2) out.push(-1);
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push(-1);
    out.push(total);
    return out;
  }, [computed.safePage, computed.totalPages]);

  const handleAuctionCreated = () => {
    setIsCreateModalOpen(false);
    router.refresh();
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('ALL');
    setSortBy('START_DESC');
    setPageSize(9);
    setPage(1);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar las subastas</p>
        <Button onClick={() => router.refresh()} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subastas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAuctions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subastas Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.activeAuctions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParticipants || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toLocaleString('es-CL') || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="space-y-4">
        {/* Pro header (match Productos style) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">Gestión de Subastas</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full">
                  Total: {stats?.totalAuctions ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  Activas: {stats?.activeAuctions ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  Participantes: {stats?.totalParticipants ?? 0}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Crea, organiza y monitorea subastas. Filtra por estado, busca por nombre y
              administra todo desde un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.refresh()}>
              Actualizar
            </Button>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 text-white"
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
                  e.currentTarget.style.backgroundColor = darkenColor(primaryColor, 10);
                }
              }}
              onMouseLeave={(e) => {
                if (primaryColor) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva Subasta
            </Button>
          </div>
        </div>

        {/* Quick tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {quickTabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Controls */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o descripción…"
                className="pl-9"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="ACTIVA">Activa</SelectItem>
                    <SelectItem value="COMPLETADA">Completada</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    <SelectItem value="ELIMINADA">Eliminada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Orden" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="START_DESC">Más recientes</SelectItem>
                    <SelectItem value="START_ASC">Más antiguas</SelectItem>
                    <SelectItem value="END_ASC">Terminan antes</SelectItem>
                    <SelectItem value="END_DESC">Terminan después</SelectItem>
                    <SelectItem value="TITLE_ASC">Nombre (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v) as any)}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 por página</SelectItem>
                    <SelectItem value="9">9 por página</SelectItem>
                    <SelectItem value="12">12 por página</SelectItem>
                  </SelectContent>
                </Select>

                {computed.hasFilters ? (
                  <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
                    Limpiar
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {activeFilterChips.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <Badge key={chip.key} variant="outline" className="gap-2 pr-1.5">
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Quitar filtro: ${chip.label}`}
                    className="rounded-full p-0.5 hover:bg-muted"
                    onClick={chip.onClear}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 text-sm text-muted-foreground">
            {computed.total === 0
              ? 'Sin resultados'
              : `Mostrando ${computed.startIdx + 1}–${computed.endIdx} de ${computed.total}`}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(pageSize)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 w-full bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : computed.pageItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {computed.pageItems.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onUpdate={() => router.refresh()}
              imageSizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              onEdit={(a) => {
                setSelectedAuction(a);
                setIsEditModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : auctions && auctions.length > 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
            <p className="text-gray-600 mb-6">Prueba ajustando los filtros o la búsqueda.</p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay subastas creadas
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primera subasta para gestionar los items de tu empresa
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
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
                  e.currentTarget.style.backgroundColor = darkenColor(primaryColor, 10);
                }
              }}
              onMouseLeave={(e) => {
                if (primaryColor) {
                  e.currentTarget.style.backgroundColor = primaryColor;
                }
              }}
            >
              Crear Primera Subasta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && computed.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Página {computed.safePage} de {computed.totalPages}
          </div>

          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={computed.safePage <= 1}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={computed.safePage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((n, idx) =>
              n === -1 ? (
                <span key={`dots-${idx}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={n}
                  variant={n === computed.safePage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(n)}
                  className="min-w-[36px]"
                >
                  {n}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(computed.totalPages, p + 1))}
              disabled={computed.safePage >= computed.totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(computed.totalPages)}
              disabled={computed.safePage >= computed.totalPages}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Create Auction Modal */}
      <AuctionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAuctionCreated}
      />

      {/* Edit Auction Modal */}
      {selectedAuction ? (
        <AuctionEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            router.refresh();
          }}
          auction={selectedAuction}
        />
      ) : null}
    </div>
  );
}
