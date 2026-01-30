'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { SafeImage } from '@/components/ui/safe-image';
import { AuctionCard } from '@/components/auctions/auction-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useCompanyContextOptional } from '@/contexts/company-context';
import { AuctionDto } from '@suba-go/shared-validation';
import { wsClient } from '@/lib/ws-client';
import { apiFetch } from '@/lib/api/api-fetch';
import { WsConnectionState, type WsServerMessage, type AuctionStatusData } from '@suba-go/shared-validation';
import Link from 'next/link';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { darkenColor } from '@/utils/color-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

function computePagination<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = items.slice(startIdx, endIdx);

  return { total, totalPages, safePage, startIdx, endIdx, pageItems };
}

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
  version?: string;
  soldPrice: number;
  soldAt: string;
  photos?: string;
}

export default function UserHomePage() {
  const { data: session } = useSession();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color || '#3B82F6';


const accessToken = (session as any)?.tokens?.accessToken as
  | string
  | undefined;
const companyTenantId = companyContext?.company?.tenantId;

// WebSocket room tracking for real-time auction status updates on this page
const wsStateRef = useRef<WsConnectionState>(WsConnectionState.DISCONNECTED);
const joinedRoomsRef = useRef<Set<string>>(new Set());
const auctionsRef = useRef<AuctionDto[]>([]);

const roomKey = (tenantId: string, auctionId: string) => `${tenantId}:${auctionId}`;

const syncRooms = (auctions: AuctionDto[]) => {
  if (wsStateRef.current !== WsConnectionState.AUTHENTICATED) return;

  const desired = new Set<string>(
    auctions.map((a) => roomKey(a.tenantId, a.id))
  );

  // Join missing
  for (const a of auctions) {
    const key = roomKey(a.tenantId, a.id);
    if (joinedRoomsRef.current.has(key)) continue;

    wsClient.send({
      event: 'JOIN_AUCTION',
      data: { tenantId: a.tenantId, auctionId: a.id },
    });
    joinedRoomsRef.current.add(key);
  }

  // Leave rooms no longer needed
  for (const key of Array.from(joinedRoomsRef.current)) {
    if (desired.has(key)) continue;

    const [tenantId, auctionId] = key.split(':');
    wsClient.send({
      event: 'LEAVE_AUCTION',
      data: { tenantId, auctionId },
    });
    joinedRoomsRef.current.delete(key);
  }
};

const leaveAuctionRoom = (tenantId: string, auctionId: string) => {
  const key = roomKey(tenantId, auctionId);
  if (!joinedRoomsRef.current.has(key)) return;

  wsClient.send({ event: 'LEAVE_AUCTION', data: { tenantId, auctionId } });
  joinedRoomsRef.current.delete(key);
};

  const [activeAuctions, setActiveAuctions] = useState<AuctionDto[]>([]);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state (same UX as Auction Manager → Subastas)
  const [auctionsPage, setAuctionsPage] = useState(1);
  const [auctionsPageSize, setAuctionsPageSize] = useState(9);
  const [soldPage, setSoldPage] = useState(1);
  const [soldPageSize, setSoldPageSize] = useState(9);

  const activeComputed = useMemo(
    () => computePagination(activeAuctions, auctionsPage, auctionsPageSize),
    [activeAuctions, auctionsPage, auctionsPageSize]
  );
  const soldComputed = useMemo(
    () => computePagination(soldItems, soldPage, soldPageSize),
    [soldItems, soldPage, soldPageSize]
  );

  const activePageNumbers = useMemo(
    () => getPageNumbers(activeComputed.totalPages, activeComputed.safePage),
    [activeComputed.safePage, activeComputed.totalPages]
  );
  const soldPageNumbers = useMemo(
    () => getPageNumbers(soldComputed.totalPages, soldComputed.safePage),
    [soldComputed.safePage, soldComputed.totalPages]
  );

  // Keep pages in range when data/page size changes
  useEffect(() => {
    if (auctionsPage !== activeComputed.safePage) setAuctionsPage(activeComputed.safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeComputed.safePage]);
  useEffect(() => {
    if (soldPage !== soldComputed.safePage) setSoldPage(soldComputed.safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soldComputed.safePage]);

  

// Keep a ref of current auctions for reconnects
useEffect(() => {
  auctionsRef.current = activeAuctions;
  syncRooms(activeAuctions);
}, [activeAuctions]);

// Establish WebSocket connection to receive AUCTION_STATUS_CHANGED events for the auctions shown here
useEffect(() => {
  if (!accessToken) return;

  const unsubscribeMessage = wsClient.onMessage((message: WsServerMessage) => {
    switch (message.event) {
      case 'AUCTION_STATUS_CHANGED': {
        const data = message.data as AuctionStatusData;

        // If tenantId is present, ignore other tenants
        if (data.tenantId && companyTenantId && data.tenantId !== companyTenantId) {
          return;
        }

        const isVisibleStatus =
          data.status === 'ACTIVA' || data.status === 'PENDIENTE';

        setActiveAuctions((prev) => {
          const idx = prev.findIndex((a) => a.id === data.auctionId);

          // Not currently listed
          if (idx === -1) {
            if (isVisibleStatus && data.auction) {
              return [data.auction as AuctionDto, ...prev];
            }
            return prev;
          }

          const current = prev[idx];

          // Remove from list when leaving active/pending
          if (!isVisibleStatus) {
            // Best-effort leave (auction objects carry tenantId)
            Promise.resolve().then(() => leaveAuctionRoom(current.tenantId, current.id));
            return prev.filter((a) => a.id !== data.auctionId);
          }

          const updated = [...prev];
          const next = data.auction
            ? ({ ...(current as any), ...(data.auction as any), status: data.status } as AuctionDto)
            : ({
                ...(current as any),
                status: data.status,
                title: data.title ?? (current as any).title,
                startTime: data.startTime ?? (current as any).startTime,
                endTime: data.endTime ?? (current as any).endTime,
              } as AuctionDto);

          updated[idx] = next;
          return updated;
        });

        return;
      }

      case 'AUCTION_ENDED': {
        const data = message.data as any;

        if (data?.tenantId && companyTenantId && data.tenantId !== companyTenantId) {
          return;
        }

        setActiveAuctions((prev) => {
          const found = prev.find((a) => a.id === data.auctionId);
          if (found) {
            Promise.resolve().then(() => leaveAuctionRoom(found.tenantId, found.id));
          }
          return prev.filter((a) => a.id !== data.auctionId);
        });
        return;
      }

      default:
        return;
    }
  });

  const unsubscribeState = wsClient.onStateChange((state: WsConnectionState) => {
    wsStateRef.current = state;

    // On reconnect/auth, re-join all rooms for current auctions
    if (state === WsConnectionState.AUTHENTICATED) {
      syncRooms(auctionsRef.current);
    }
  });

  wsClient.connect(accessToken).catch((err) => {
    console.error('Failed to connect WebSocket:', err);
  });

  return () => {
    unsubscribeMessage();
    unsubscribeState();

    // Leave rooms joined from this page
    for (const key of Array.from(joinedRoomsRef.current)) {
      const [tenantId, auctionId] = key.split(':');
      wsClient.send({ event: 'LEAVE_AUCTION', data: { tenantId, auctionId } });
    }
    joinedRoomsRef.current.clear();
  };
}, [accessToken, companyTenantId]);

useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const [registrationsRes, itemsRes] = await Promise.all([
          // Client requirement: USER should only see auctions where they are registered/invited
          apiFetch('/api/auctions/my-registrations'),
          apiFetch(`/api/items/sold-to/${session.user.id}`),
        ]);

        if (registrationsRes.ok) {
          const regs = await registrationsRes.json();
          const auctionsData = (Array.isArray(regs) ? regs : [])
            .map((r: any) => r?.auction)
            .filter(Boolean);

          const filtered = (Array.isArray(auctionsData) ? auctionsData : []).filter(
            (a: AuctionDto) => a.status === 'ACTIVA' || a.status === 'PENDIENTE'
          );
          setActiveAuctions(filtered);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setSoldItems(Array.isArray(itemsData) ? itemsData : []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Subastas Activas o Por Participar */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
              Subastas Activas y Próximas
            </h2>
            <p className="text-sm text-gray-600 mt-1">Solo subastas donde estás invitado/registrado.</p>
          </div>
          <Link href="/mis-subastas">
            <Button
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
              Ver mis subastas
            </Button>
          </Link>
        </div>
        {activeAuctions.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {activeComputed.total === 0
                  ? 'Sin resultados'
                  : `Mostrando ${activeComputed.startIdx + 1}–${activeComputed.endIdx} de ${activeComputed.total}`}
              </div>
              <div className="flex gap-3">
                <Select
                  value={String(auctionsPageSize)}
                  onValueChange={(v) => {
                    setAuctionsPageSize(Number(v));
                    setAuctionsPage(1);
                  }}
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeComputed.pageItems.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onUpdate={() => {
                  /* No-op for user view */
                }}
                imageSizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              ))}
            </div>

            {!loading && activeComputed.totalPages > 1 ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {activeComputed.safePage} de {activeComputed.totalPages}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuctionsPage(1)}
                    disabled={activeComputed.safePage <= 1}
                    aria-label="Primera página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuctionsPage((p) => Math.max(1, p - 1))}
                    disabled={activeComputed.safePage <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {activePageNumbers.map((n, idx) =>
                    n === -1 ? (
                      <span key={`dots-a-${idx}`} className="px-2 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={n}
                        variant={n === activeComputed.safePage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAuctionsPage(n)}
                        className="min-w-[36px]"
                      >
                        {n}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuctionsPage((p) => Math.min(activeComputed.totalPages, p + 1))}
                    disabled={activeComputed.safePage >= activeComputed.totalPages}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuctionsPage(activeComputed.totalPages)}
                    disabled={activeComputed.safePage >= activeComputed.totalPages}
                    aria-label="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay subastas activas o próximas en este momento.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Mis Items Adjudicados */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
              Mis Adjudicaciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">Items adjudicados a tu cuenta.</p>
          </div>
          <Link href="/adjudicaciones">
            <Button
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
              Ver todas
            </Button>
          </Link>
        </div>

        {soldItems.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {soldComputed.total === 0
                  ? 'Sin resultados'
                  : `Mostrando ${soldComputed.startIdx + 1}–${soldComputed.endIdx} de ${soldComputed.total}`}
              </div>
              <div className="flex gap-3">
                <Select
                  value={String(soldPageSize)}
                  onValueChange={(v) => {
                    setSoldPageSize(Number(v));
                    setSoldPage(1);
                  }}
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {soldComputed.pageItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative bg-gray-100">
                    {item.photos ? (
                      <SafeImage
                        src={
                          ((): string => {
                            try {
                              const parsed = JSON.parse(item.photos);
                              if (Array.isArray(parsed) && parsed[0]) {
                                return String(parsed[0]);
                              }
                            } catch {
                              // ignore
                            }
                            return item.photos?.split(',')[0]?.trim() || '/placeholder-car.png';
                          })()
                        }
                        alt={`${item.brand} ${item.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        quality={82}
                        // Improves real-world reliability on production (especially Vercel Blob)
                        fallbackSrc="/placeholder-car.png"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {item.brand} {item.model} {item.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{item.version}</p>
                    <p className="text-sm font-medium text-gray-900">
                      Adjudicado por: ${item.soldPrice.toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Fecha: {new Date(item.soldAt).toLocaleDateString('es-CL')}
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
                        Ver Detalle
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!loading && soldComputed.totalPages > 1 ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {soldComputed.safePage} de {soldComputed.totalPages}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoldPage(1)}
                    disabled={soldComputed.safePage <= 1}
                    aria-label="Primera página"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoldPage((p) => Math.max(1, p - 1))}
                    disabled={soldComputed.safePage <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {soldPageNumbers.map((n, idx) =>
                    n === -1 ? (
                      <span key={`dots-s-${idx}`} className="px-2 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={n}
                        variant={n === soldComputed.safePage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSoldPage(n)}
                        className="min-w-[36px]"
                      >
                        {n}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoldPage((p) => Math.min(soldComputed.totalPages, p + 1))}
                    disabled={soldComputed.safePage >= soldComputed.totalPages}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoldPage(soldComputed.totalPages)}
                    disabled={soldComputed.safePage >= soldComputed.totalPages}
                    aria-label="Última página"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Aún no tienes items adjudicados.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
