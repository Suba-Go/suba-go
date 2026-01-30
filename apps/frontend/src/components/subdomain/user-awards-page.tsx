'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from 'lucide-react';

import { useFetchData } from '@/hooks/use-fetch-data';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { darkenColor } from '@/utils/color-utils';

import { Button } from '@suba-go/shared-components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@suba-go/shared-components/components/ui/card';
import { Input } from '@suba-go/shared-components/components/ui/input';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';

type SortKey = 'DATE_DESC' | 'DATE_ASC' | 'PRICE_DESC' | 'PRICE_ASC' | 'BRAND_ASC';

function getPageNumbers(totalPages: number, currentPage: number) {
  const out: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) out.push(i);
    return out;
  }

  const windowSize = 2;
  const start = Math.max(2, currentPage - windowSize);
  const end = Math.min(totalPages - 1, currentPage + windowSize);

  out.push(1);
  if (start > 2) out.push(-1);
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push(-1);
  out.push(totalPages);
  return out;
}

interface SoldItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  version?: string | null;
  kilometraje?: number | null;
  soldPrice: number;
  soldAt: string;
  photos?: string | null;
}

function normalizeText(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

function toMs(v?: string | Date | null) {
  if (!v) return 0;
  const d = typeof v === 'string' ? new Date(v) : v;
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function parseFirstPhoto(photos?: string | null): string {
  if (!photos) return '/placeholder-car.png';

  try {
    const parsed = JSON.parse(photos);
    if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]);
  } catch {
    // ignore
  }

  const first = photos.split(',')[0]?.trim();
  return first || '/placeholder-car.png';
}

export default function UserAwardsPage() {
  const { data: session } = useSession();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color || '#FCD34D';

  const userId = (session?.user as any)?.id as string | undefined;

  const { data, isLoading, error } = useFetchData<SoldItem[]>({
    url: userId ? `/api/items/sold-to/${userId}` : '/api/items/sold-to/unknown',
    key: ['user-awards', userId || 'unknown'],
    condition: Boolean(userId),
    revalidateOnMount: true,
  });

  const items = Array.isArray(data) ? data : [];

  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('DATE_DESC');
  const [pageSize, setPageSize] = useState<6 | 9 | 12>(9);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, minPrice, maxPrice, sortBy, pageSize]);

  const computed = useMemo(() => {
    const q = normalizeText(query);
    const min = minPrice ? Number(String(minPrice).replace(/[^0-9]/g, '')) : undefined;
    const max = maxPrice ? Number(String(maxPrice).replace(/[^0-9]/g, '')) : undefined;

    let list = [...items];

    if (q) {
      list = list.filter((i) => {
        const hay = [i.plate, i.brand, i.model, i.year, i.version]
          .map(normalizeText)
          .join(' ');
        return hay.includes(q);
      });
    }

    if (Number.isFinite(min as number)) {
      list = list.filter((i) => (i.soldPrice ?? 0) >= (min as number));
    }
    if (Number.isFinite(max as number)) {
      list = list.filter((i) => (i.soldPrice ?? 0) <= (max as number));
    }

    list.sort((a, b) => {
      if (sortBy === 'DATE_ASC') return toMs(a.soldAt) - toMs(b.soldAt);
      if (sortBy === 'DATE_DESC') return toMs(b.soldAt) - toMs(a.soldAt);
      if (sortBy === 'PRICE_ASC') return (a.soldPrice ?? 0) - (b.soldPrice ?? 0);
      if (sortBy === 'PRICE_DESC') return (b.soldPrice ?? 0) - (a.soldPrice ?? 0);
      return String(a.brand || '').localeCompare(String(b.brand || ''), 'es');
    });

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);

    return {
      total,
      totalPages,
      safePage,
      startIdx,
      endIdx,
      pageItems: list.slice(startIdx, endIdx),
      hasFilters: Boolean(q) || Boolean(minPrice) || Boolean(maxPrice),
    };
  }, [items, maxPrice, minPrice, page, pageSize, query, sortBy]);

  const pageNumbers = useMemo(
    () => getPageNumbers(computed.totalPages, computed.safePage),
    [computed.totalPages, computed.safePage]
  );

  const clearFilters = () => {
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('DATE_DESC');
    setPageSize(9);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-600">
          No se pudieron cargar tus adjudicaciones.
        </CardContent>
      </Card>
    );
  }

  return (
    // Keep the same layout width as the rest of the app (navbar, home, stats, etc.)
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            Mis Adjudicaciones
          </h1>
          <p className="text-sm text-gray-600 mt-1">Items adjudicados a tu cuenta.</p>
        </div>

        <Badge
          className="w-fit"
          style={{ backgroundColor: primaryColor, color: '#ffffff' }}
        >
          {computed.total} item{computed.total === 1 ? '' : 's'}
        </Badge>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por patente, marca, modelo, año"
                className="pl-9"
              />
            </div>

            <Input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Precio mín."
              inputMode="numeric"
            />
            <Input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Precio máx."
              inputMode="numeric"
            />

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger>
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DATE_DESC">Fecha (más reciente)</SelectItem>
                <SelectItem value="DATE_ASC">Fecha (más antigua)</SelectItem>
                <SelectItem value="PRICE_DESC">Precio (mayor)</SelectItem>
                <SelectItem value="PRICE_ASC">Precio (menor)</SelectItem>
                <SelectItem value="BRAND_ASC">Marca (A–Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) as 6 | 9 | 12)}>
                <SelectTrigger>
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!computed.hasFilters}
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {computed.total === 0
            ? 'Sin resultados'
            : `Mostrando ${computed.startIdx + 1}–${computed.endIdx} de ${computed.total}`}
        </div>
      </div>

      {computed.pageItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computed.pageItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video relative bg-gray-100">
                <SafeImage
                  src={parseFirstPhoto(item.photos)}
                  alt={`${item.brand} ${item.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={82}
                />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {item.brand} {item.model} {item.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Patente: <span className="font-medium text-gray-900">{item.plate}</span></p>
                  {item.version ? <p>Versión: {item.version}</p> : null}
                  {typeof item.kilometraje === 'number' ? <p>Kilometraje: {item.kilometraje.toLocaleString('es-CL')}</p> : null}
                </div>
                <p className="text-sm font-medium text-gray-900 mt-3">
                  Adjudicado por: ${Number(item.soldPrice || 0).toLocaleString('es-CL')}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Fecha: {item.soldAt ? new Date(item.soldAt).toLocaleDateString('es-CL') : '—'}
                </p>

                <Link href={`/items/${item.id}`} className="block mt-4">
                  <Button
                    className="w-full"
                    style={
                      primaryColor
                        ? {
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                            color: '#ffffff',
                          }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (primaryColor) {
                        e.currentTarget.style.backgroundColor = darkenColor(primaryColor, 10);
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
                    Ver detalle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Aún no tienes items adjudicados.
          </CardContent>
        </Card>
      )}

      {computed.totalPages > 1 ? (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    </div>
  );
}
