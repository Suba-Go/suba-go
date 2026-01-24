'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ItemDto,
  ItemStateEnum,
  ShowItemStateEnum,
} from '@suba-go/shared-validation';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Input } from '@suba-go/shared-components/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@suba-go/shared-components/components/ui/tabs';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';
import { apiFetch } from '@/lib/api/api-fetch';
import { ItemCreateModal } from './item-create-modal';
import { ItemEditModal } from './item-edit-modal';
import { ItemsDashboardSkeleton } from './items-dashboard-skeleton';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useAutoFormat } from '@/hooks/use-auto-format';
import Image from 'next/image';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';

interface ItemsDashboardProps {
  subdomain: string;
}

type SortKey =
  | 'newest'
  | 'oldest'
  | 'price_desc'
  | 'price_asc'
  | 'plate_asc'
  | 'plate_desc';

const DEFAULT_PAGE_SIZE = 9;

function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

function getPaginationRange(current: number, total: number) {
  // 1 ... (current-1) current (current+1) ... total
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}

export function ItemsDashboard({ subdomain }: ItemsDashboardProps) {
  const router = useRouter();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color;
  const [items, setItems] = useState<ItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { formatNumberWithSeparators } = useAutoFormat();

  const fetchItems = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/items');

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
  }, [searchTerm, filterState, sortKey, pageSize]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar producto');
      }

      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });

      fetchItems();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const byState: Record<string, number> = {};
    for (const it of items) {
      byState[it.state] = (byState[it.state] ?? 0) + 1;
    }
    return {
      total,
      disponible: byState[ItemStateEnum.DISPONIBLE] ?? 0,
      enSubasta: byState[ItemStateEnum.EN_SUBASTA] ?? 0,
      vendido: byState[ItemStateEnum.VENDIDO] ?? 0,
      eliminado: byState[ItemStateEnum.ELIMINADO] ?? 0,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const matchesSearch =
        !term ||
        item.plate?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term) ||
        item.model?.toLowerCase().includes(term);

      const matchesFilter = filterState === 'all' || item.state === filterState;

      return matchesSearch && matchesFilter;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aCreated = new Date(a.createdAt || 0).getTime();
      const bCreated = new Date(b.createdAt || 0).getTime();
      const aPrice = Number(a.basePrice ?? 0);
      const bPrice = Number(b.basePrice ?? 0);

      switch (sortKey) {
        case 'oldest':
          return aCreated - bCreated;
        case 'price_desc':
          return bPrice - aPrice;
        case 'price_asc':
          return aPrice - bPrice;
        case 'plate_desc':
          return (b.plate ?? '').localeCompare(a.plate ?? '');
        case 'plate_asc':
          return (a.plate ?? '').localeCompare(b.plate ?? '');
        case 'newest':
        default:
          return bCreated - aCreated;
      }
    });

    return sorted;
  }, [items, searchTerm, filterState, sortKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / pageSize)),
    [filteredItems.length, pageSize]
  );

  useEffect(() => {
    setPage((p) => clampPage(p, totalPages));
  }, [totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const showingFrom = filteredItems.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, filteredItems.length);

  const getStateColor = (state: string) => {
    switch (state) {
      case ItemStateEnum.DISPONIBLE:
        return 'bg-green-100 text-green-800';
      case ItemStateEnum.EN_SUBASTA:
        return 'bg-blue-100 text-blue-800';
      case ItemStateEnum.VENDIDO:
        return 'bg-gray-100 text-gray-800';
      case ItemStateEnum.ELIMINADO:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters =
    !!searchTerm.trim() || filterState !== 'all' || sortKey !== 'newest';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterState('all');
    setSortKey('newest');
  };

  const stateLabel = (state: string) => {
    const label = (ShowItemStateEnum as any)[state];
    return label || state;
  };

  // Avoid showing "no items" empty-state while the first load is still in progress.
  if (isLoading && items.length === 0) {
    return <ItemsDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Pro header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">Productos</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">
                Total: {stats.total}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                Disponibles: {stats.disponible}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                En subasta: {stats.enSubasta}
              </Badge>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona productos, fotos y disponibilidad para subastas.
          </p>
        </div>

        {!primaryColor ? (
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span className="text-sm text-gray-500">Cargando...</span>
          </div>
        ) : (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkenColor(
                primaryColor,
                10
              );
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            <Plus className="h-4 w-4" />
            Crear Producto
          </Button>
        )}
      </div>

      {/* Quick tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filterState} onValueChange={setFilterState}>
          <TabsList className="flex flex-wrap justify-start">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value={ItemStateEnum.DISPONIBLE}>Disponibles</TabsTrigger>
            <TabsTrigger value={ItemStateEnum.EN_SUBASTA}>En subasta</TabsTrigger>
            <TabsTrigger value={ItemStateEnum.VENDIDO}>Vendidos</TabsTrigger>
            <TabsTrigger value={ItemStateEnum.ELIMINADO}>Eliminados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{showingFrom}</span>–
          <span className="font-medium">{showingTo}</span> de{' '}
          <span className="font-medium">{filteredItems.length}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por patente, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-10 pl-10 pr-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="newest">Más nuevos</option>
                <option value="oldest">Más antiguos</option>
                <option value="price_desc">Precio base ↓</option>
                <option value="price_asc">Precio base ↑</option>
                <option value="plate_asc">Patente A–Z</option>
                <option value="plate_desc">Patente Z–A</option>
              </select>
            </div>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 px-3 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value={6}>6 / pág</option>
              <option value={9}>9 / pág</option>
              <option value={12}>12 / pág</option>
            </select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10"
            onClick={fetchItems}
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm.trim() && (
            <Badge variant="secondary" className="rounded-full gap-1">
              Búsqueda: “{searchTerm.trim()}”
              <button
                type="button"
                className="ml-1 inline-flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterState !== 'all' && (
            <Badge variant="secondary" className="rounded-full gap-1">
              Estado: {stateLabel(filterState)}
              <button
                type="button"
                className="ml-1 inline-flex items-center"
                onClick={() => setFilterState('all')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortKey !== 'newest' && (
            <Badge variant="secondary" className="rounded-full gap-1">
              Orden: {sortKey}
              <button
                type="button"
                className="ml-1 inline-flex items-center"
                onClick={() => setSortKey('newest')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            {/* Image Preview */}
            <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
              {item.photos ? (
                <>
                  <Image
                    src={item.photos.split(',')[0]?.trim()}
                    alt={`${item.brand} ${item.model}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={82}
                    className="object-cover"
                  />
                  {item.photos.split(',').length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      +{item.photos.split(',').length - 1} más
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-xs">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {item.plate || 'Sin Patente'}
                </CardTitle>
                <Badge className={getStateColor(item.state)}>
                  {stateLabel(item.state)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Marca:</span>{' '}
                  {item.brand || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Modelo:</span>{' '}
                  {item.model || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Año:</span> {item.year || 'N/A'}
                </p>
                {item.kilometraje && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Kilometraje:</span>{' '}
                    {item.kilometraje.toLocaleString()} km
                  </p>
                )}
                {item.basePrice && (
                  <p className="text-sm font-semibold text-black-600">
                    <span className="font-medium">Precio base:</span> $
                    {formatNumberWithSeparators(item.basePrice)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/items/${item.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{showingFrom}</span>–
            <span className="font-medium">{showingTo}</span> de{' '}
            <span className="font-medium">{filteredItems.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPaginationRange(page, totalPages).map((p, idx) =>
              p === '...' ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 text-sm text-gray-500"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              {totalPages}
            </Button>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay productos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterState !== 'all'
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comienza creando tu primer producto'}
          </p>
          {!searchTerm && filterState === 'all' && (
            <div className="mt-6">
              {primaryColor ? (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = darkenColor(
                        primaryColor,
                        10
                      );
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (primaryColor) {
                      e.currentTarget.style.backgroundColor = primaryColor;
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Producto
                </Button>
              ) : (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Producto
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ItemCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        subdomain={subdomain}
      />

      <ItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchItems();
        }}
        item={selectedItem}
      />
    </div>
  );
}
