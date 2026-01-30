'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api/api-fetch';

import { AuctionCard } from '@/components/auctions/auction-card';
import { useCompanyContextOptional } from '@/contexts/company-context';

import { Button } from '@suba-go/shared-components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@suba-go/shared-components/components/ui/card';
import { Input } from '@suba-go/shared-components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@suba-go/shared-components/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@suba-go/shared-components/components/ui/tabs';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { Badge } from '@suba-go/shared-components/components/ui/badge';
import type { AuctionDto } from '@suba-go/shared-validation';

function safeString(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

export default function UserAuctionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const companyContext = useCompanyContextOptional();
  const primaryColor = companyContext?.company?.principal_color || '#2563EB';

  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [query, setQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'ACTIVA'>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'COMPLETADA' | 'CANCELADA'>('ALL');
  const [sort, setSort] = useState<'END_DESC' | 'END_ASC' | 'START_ASC' | 'START_DESC'>('END_DESC');
  const [tab, setTab] = useState<'active' | 'history'>('active');

  // Grid + paginado (mismo UX que dashboard de subastas del Auction Manager)
  const [pageSize, setPageSize] = useState<6 | 9 | 12>(9);
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);


  // --- Realtime status sync for "Mis Subastas" ---
  // This view previously fetched once and would remain stale (e.g. PENDIENTE) even after the auction started.
  // We open ONE WS connection and join the rooms for the user's relevant auctions (PENDIENTE/ACTIVA),
  // so AUCTION_STATUS_CHANGED updates the list immediately.
  const accessToken = session?.tokens?.accessToken ?? '';
  const tenantId = useMemo(() => {
    return (
      (companyContext?.company as any)?.tenantId ??
      (session?.user as any)?.tenantId ??
      // Fallback: derive from the first auction once loaded
      (auctions.find((a: any) => a?.tenantId)?.tenantId as string | undefined) ??
      ''
    );
  }, [companyContext?.company, session?.user, auctions]);

  const wsRef = useRef<WebSocket | null>(null);
  const joinedAuctionsRef = useRef<Set<string>>(new Set());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const unmountedRef = useRef(false);

  // --- Shared server-synced clock for ALL cards in this page ---
  // We compute an NTP-style offset using WS PING/PONG and drive a single ticker.
  // This prevents subtle 1s drift between cards and keeps "Termina en" consistent
  // when the server extends time (soft-close).
  const baseClientNowRef = useRef<number>(0);
  const basePerfRef = useRef<number>(0);
  const serverOffsetRef = useRef<number>(0);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [syncedNowMs, setSyncedNowMs] = useState<number>(() => Date.now());
  const timeTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep track of outstanding PINGs: requestId -> clientSendMs
  const pendingPingsRef = useRef<Map<string, number>>(new Map());

  const createRequestId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const clientNowMonotonicMs = () => {
    // Initialize base anchors lazily (client-only component).
    if (!baseClientNowRef.current) {
      baseClientNowRef.current = Date.now();
      basePerfRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
    }
    const perfNow = typeof performance !== 'undefined' ? performance.now() : 0;
    return baseClientNowRef.current + (perfNow - basePerfRef.current);
  };

  const applyOffsetSample = (sampleOffsetMs: number, weight = 0.2) => {
    // Smooth offset updates to avoid jitter when RTT fluctuates.
    const prev = serverOffsetRef.current || 0;
    const next = prev + (sampleOffsetMs - prev) * weight;
    serverOffsetRef.current = next;
    setServerOffsetMs(next);
  };

  const stopTimeTicker = () => {
    if (timeTickerRef.current) {
      clearInterval(timeTickerRef.current);
      timeTickerRef.current = null;
    }
  };

  const stopTimeSync = () => {
    if (timeSyncIntervalRef.current) {
      clearInterval(timeSyncIntervalRef.current);
      timeSyncIntervalRef.current = null;
    }
    pendingPingsRef.current.clear();
  };

  const wsUrl = useMemo(() => {
    const endpoint =
      process.env.NEXT_PUBLIC_WS_ENDPOINT ||
      (process.env.BACKEND_URL
        ? process.env.BACKEND_URL.replace(/^http/, 'ws') + '/ws'
        : 'ws://localhost:3001/ws');
    return accessToken ? `${endpoint}?token=${encodeURIComponent(accessToken)}` : '';
  }, [accessToken]);

  const realtimeTargetAuctionIds = useMemo(() => {
    // Only join rooms that can change in realtime for this view
    return auctions
      .filter((a) => a?.id && (a.status === 'PENDIENTE' || a.status === 'ACTIVA'))
      .map((a) => a.id as string);
  }, [auctions]);

  const realtimeTargetAuctionIdsRef = useRef<string[]>([]);
  useEffect(() => {
    realtimeTargetAuctionIdsRef.current = realtimeTargetAuctionIds;
  }, [realtimeTargetAuctionIds]);

  const upsertAuctionFromWs = (auctionId: string, patch: Partial<AuctionDto> & any) => {
    setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, ...patch } : a)));
  };

  // Adaptive tick for smoother UI close to boundaries (start/end), without burning CPU.
  const adaptiveTickMs = useMemo(() => {
    const now = Date.now() + serverOffsetMs;
    let minDelta = Number.POSITIVE_INFINITY;
    for (const a of auctions) {
      const start = a?.startTime ? new Date(a.startTime as any).getTime() : 0;
      const end = a?.endTime ? new Date(a.endTime as any).getTime() : 0;
      if (!start || !end) continue;
      // Pending -> target start; Active -> target end.
      const target = a.status === 'PENDIENTE' ? start : a.status === 'ACTIVA' ? end : 0;
      if (!target) continue;
      const d = target - now;
      if (d > 0 && d < minDelta) minDelta = d;
    }
    if (minDelta <= 15_000) return 100;
    if (minDelta <= 120_000) return 250;
    return 1000;
  }, [auctions, serverOffsetMs]);

  // Drive ONE shared server-synced clock for the whole page.
  useEffect(() => {
    stopTimeTicker();
    const tick = adaptiveTickMs;
    if (!tick || tick <= 0) return;

    const updateNow = () => {
      const next = clientNowMonotonicMs() + (serverOffsetRef.current || 0);
      setSyncedNowMs((prev) => (next > prev ? next : prev));
    };

    // Immediate update so first paint is aligned.
    updateNow();

    timeTickerRef.current = setInterval(updateNow, tick);
    return () => stopTimeTicker();
  }, [adaptiveTickMs]);

  // Connect WS once (per page mount) to receive status changes.
  useEffect(() => {
    unmountedRef.current = false;

    if (!wsUrl || !tenantId) return;

    const cleanup = () => {
      // Stop shared clock services before touching the socket.
      stopTimeSync();
      stopTimeTicker();

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = wsRef.current;
      wsRef.current = null;

      if (ws) {
        try {
          // Leave joined rooms gracefully
          joinedAuctionsRef.current.forEach((auctionId) => {
            try {
              ws.send(
                JSON.stringify({
                  event: 'LEAVE_AUCTION',
                  data: { tenantId, auctionId },
                })
              );
            } catch {
              // ignore
            }
          });
          joinedAuctionsRef.current.clear();
        } finally {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }
      }
    };

    const safeParse = (raw: any) => {
      try {
        if (typeof raw !== 'string') return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const backoffMs = (attempt: number) => {
      const base = 600;
      const ms = Math.floor(base * Math.pow(1.6, attempt));
      return Math.min(ms, 12_000);
    };

    const sendPing = (ws: WebSocket) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const requestId = createRequestId();
      const clientTimeMs = Date.now();
      pendingPingsRef.current.set(requestId, clientTimeMs);
      try {
        ws.send(
          JSON.stringify({
            event: 'PING',
            data: { requestId, clientTimeMs },
          })
        );
      } catch {
        // ignore
      }
    };

    const startTimeSync = (ws: WebSocket) => {
      stopTimeSync();
      // Kick one ping immediately and then keep a cadence.
      sendPing(ws);
      timeSyncIntervalRef.current = setInterval(() => sendPing(ws), 15_000);
    };

    const connect = () => {
      if (unmountedRef.current) return;

      cleanup();

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (e) {
        console.error('WS init failed:', e);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;

        // Start periodic clock sync (PING/PONG) as soon as the socket is open.
        startTimeSync(ws);

        // Join current targets immediately
        (realtimeTargetAuctionIdsRef.current || []).forEach((auctionId) => {
          if (joinedAuctionsRef.current.has(auctionId)) return;
          joinedAuctionsRef.current.add(auctionId);
          ws.send(
            JSON.stringify({
              event: 'JOIN_AUCTION',
              data: { tenantId, auctionId },
            })
          );
        });
      };

      ws.onmessage = (ev) => {
        const msg = safeParse(ev.data);
        if (!msg || typeof msg.event !== 'string') return;

        if (msg.event === 'PONG') {
          const requestId = msg.data?.requestId;
          const echoedClientTimeMs = typeof msg.data?.clientTimeMs === 'number' ? msg.data.clientTimeMs : undefined;
          const serverTimeMs = typeof msg.data?.serverTimeMs === 'number' ? msg.data.serverTimeMs : undefined;
          const tRecv = Date.now();

          const tSend =
            (requestId && pendingPingsRef.current.get(requestId)) ??
            echoedClientTimeMs;
          if (requestId) pendingPingsRef.current.delete(requestId);

          if (typeof tSend === 'number' && typeof serverTimeMs === 'number') {
            const rtt = Math.max(0, tRecv - tSend);
            // Estimate server time at receive: serverTimeMs + rtt/2 (assumes symmetric path).
            const estimatedServerNow = serverTimeMs + rtt / 2;
            const sampleOffset = estimatedServerNow - tRecv;
            applyOffsetSample(sampleOffset, 0.25);
          }
          return;
        }

        if (msg.event === 'JOINED') {
          const a = msg.data?.auction;
          const st = typeof msg.data?.serverTimeMs === 'number' ? msg.data.serverTimeMs : undefined;
          if (typeof st === 'number') {
            // Quick coarse correction on join (no RTT) - keep weight low.
            applyOffsetSample(st - Date.now(), 0.1);
          }
          if (a?.id) {
            upsertAuctionFromWs(a.id, {
              status: a.status,
              startTime: a.startTime,
              endTime: a.endTime,
            });
          }
          return;
        }

        if (msg.event === 'AUCTION_STATUS_CHANGED') {
          const auctionId = msg.data?.auctionId;
          const status = msg.data?.status;
          const a = msg.data?.auction;
          if (auctionId && status) {
            upsertAuctionFromWs(auctionId, {
              status,
              ...(a?.startTime ? { startTime: a.startTime } : null),
              ...(a?.endTime ? { endTime: a.endTime } : null),
            });
          }
          return;
        }

        if (msg.event === 'AUCTION_TIME_EXTENDED') {
          // Keep list cards consistent if the server extended the auction end time.
          const auctionId = msg.data?.auctionId;
          const newEndTime = msg.data?.newEndTime;
          const st = typeof msg.data?.serverTimeMs === 'number' ? msg.data.serverTimeMs : undefined;
          if (typeof st === 'number') {
            applyOffsetSample(st - Date.now(), 0.15);
          }
          if (auctionId && newEndTime) {
            upsertAuctionFromWs(auctionId, { endTime: newEndTime });
          }
          return;
        }
      };

      ws.onerror = () => {
        // ignore; close handler will trigger reconnect
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        const attempt = reconnectAttemptRef.current++;
        const wait = backoffMs(attempt);
        reconnectTimerRef.current = setTimeout(connect, wait);
      };
    };

    connect();

    return () => {
      unmountedRef.current = true;
      cleanup();
    };
    // Connect only when auth/tenant changes
  }, [wsUrl, tenantId]);

  // Join newly visible auctions as the list changes (without reopening socket).
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!tenantId) return;

    realtimeTargetAuctionIds.forEach((auctionId) => {
      if (joinedAuctionsRef.current.has(auctionId)) return;
      joinedAuctionsRef.current.add(auctionId);
      try {
        ws.send(
          JSON.stringify({
            event: 'JOIN_AUCTION',
            data: { tenantId, auctionId },
          })
        );
      } catch {
        // ignore
      }
    });
  }, [realtimeTargetAuctionIds, tenantId]);

  // Hard guard: only USER should access these views (client requirement)
  useEffect(() => {
    if (status !== 'loading' && session?.user?.role && session.user.role !== 'USER') {
      router.replace('/');
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.id) return;

      setLoading(true);
      try {
        const res = await apiFetch('/api/auctions/my-registrations', { cache: 'no-store' });
        const regs = res.ok ? await res.json() : [];
        const mapped = (Array.isArray(regs) ? regs : [])
          .map((r: any) => r?.auction)
          .filter(Boolean)
          // hide deleted auctions
          .filter((a: AuctionDto) => a.status !== 'ELIMINADA');

        setAuctions(mapped);
      } catch (e) {
        console.error('Failed to fetch user auctions:', e);
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [session?.user?.id]);

  const { activeAuctions, historicalAuctions } = useMemo(() => {
    const active = auctions.filter((a) => a.status === 'ACTIVA' || a.status === 'PENDIENTE');
    const hist = auctions.filter((a) => a.status === 'COMPLETADA' || a.status === 'CANCELADA');
    return { activeAuctions: active, historicalAuctions: hist };
  }, [auctions]);

  const normalizedQuery = query.trim().toLowerCase();

  const applyFilters = (list: AuctionDto[], tab: 'active' | 'history') => {
    let out = list;

    if (normalizedQuery) {
      out = out.filter((a) => {
        const hay = (safeString(a.title) + ' ' + safeString((a as any).description)).toLowerCase();
        return hay.includes(normalizedQuery);
      });
    }

    if (tab === 'active') {
      if (activeStatusFilter !== 'ALL') {
        out = out.filter((a) => a.status === activeStatusFilter);
      }
    } else {
      if (historyStatusFilter !== 'ALL') {
        out = out.filter((a) => a.status === historyStatusFilter);
      }
    }

    const toTime = (d: any) => (d ? new Date(d).getTime() : 0);

    out = [...out].sort((a, b) => {
      const aStart = toTime((a as any).startTime);
      const bStart = toTime((b as any).startTime);
      const aEnd = toTime((a as any).endTime);
      const bEnd = toTime((b as any).endTime);

      switch (sort) {
        case 'END_ASC':
          return aEnd - bEnd;
        case 'START_ASC':
          return aStart - bStart;
        case 'START_DESC':
          return bStart - aStart;
        case 'END_DESC':
        default:
          return bEnd - aEnd;
      }
    });

    return out;
  };

  const filteredActive = useMemo(
    () => applyFilters(activeAuctions, 'active'),
    [activeAuctions, normalizedQuery, activeStatusFilter, sort]
  );

  const filteredHistory = useMemo(
    () => applyFilters(historicalAuctions, 'history'),
    [historicalAuctions, normalizedQuery, historyStatusFilter, sort]
  );

  // Reset páginas cuando cambian filtros/orden/paginación
  useEffect(() => {
    setActivePage(1);
    setHistoryPage(1);
  }, [normalizedQuery, activeStatusFilter, historyStatusFilter, sort, pageSize]);

  const clearQuery = () => setQuery('');

  const gridImageSizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw';

  const makePageNumbers = (totalPages: number, current: number) => {
    const out: number[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    const windowSize = 2;
    const start = Math.max(2, current - windowSize);
    const end = Math.min(totalPages - 1, current + windowSize);
    out.push(1);
    if (start > 2) out.push(-1);
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages - 1) out.push(-1);
    out.push(totalPages);
    return out;
  };

  const computedActive = useMemo(() => {
    const total = filteredActive.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, activePage), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    return {
      total,
      totalPages,
      safePage,
      startIdx,
      endIdx,
      pageItems: filteredActive.slice(startIdx, endIdx),
      pageNumbers: makePageNumbers(totalPages, safePage),
    };
  }, [filteredActive, activePage, pageSize]);

  const computedHistory = useMemo(() => {
    const total = filteredHistory.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, historyPage), totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    return {
      total,
      totalPages,
      safePage,
      startIdx,
      endIdx,
      pageItems: filteredHistory.slice(startIdx, endIdx),
      pageNumbers: makePageNumbers(totalPages, safePage),
    };
  }, [filteredHistory, historyPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            Mis Subastas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Subastas en las que estás invitado/registrado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Activas: {activeAuctions.length}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Históricas: {historicalAuctions.length}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título o descripción..."
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="END_DESC">Terminan más tarde</SelectItem>
                  <SelectItem value="END_ASC">Terminan más pronto</SelectItem>
                  <SelectItem value="START_DESC">Comienzan más tarde</SelectItem>
                  <SelectItem value="START_ASC">Comienzan más pronto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(pageSize)} onValueChange={(v: any) => setPageSize(Number(v) as any)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 por página</SelectItem>
                  <SelectItem value="9">9 por página</SelectItem>
                  <SelectItem value="12">12 por página</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setActiveStatusFilter('ALL');
                  setHistoryStatusFilter('ALL');
                  setSort('END_DESC');
                  setPageSize(9);
                  setActivePage(1);
                  setHistoryPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Tabs value={tab} onValueChange={(v: any) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="active">Activas / Próximas</TabsTrigger>
                <TabsTrigger value="history">Históricas</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Select value={activeStatusFilter} onValueChange={(v: any) => setActiveStatusFilter(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="ACTIVA">Activa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  {computedActive.total === 0
                    ? 'Sin resultados'
                    : `Mostrando ${computedActive.startIdx + 1}–${computedActive.endIdx} de ${computedActive.total}`}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner className="size-6" />
                  </div>
                ) : computedActive.total === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No hay subastas activas/próximas con los filtros actuales.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {computedActive.pageItems.map((auction) => (
                      <AuctionCard
                        key={auction.id}
                        auction={auction as any}
                        onUpdate={() => {}}
                        clock={{ nowMs: syncedNowMs, serverOffsetMs, tickMs: adaptiveTickMs }}
                        imageSizes={gridImageSizes}
                        imageQuality={82}
                      />
                    ))}
                  </div>
                )}

                {!loading && computedActive.totalPages > 1 ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {computedActive.safePage} de {computedActive.totalPages}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePage(1)}
                        disabled={computedActive.safePage <= 1}
                        aria-label="Primera página"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                        disabled={computedActive.safePage <= 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {computedActive.pageNumbers.map((n, idx) =>
                        n === -1 ? (
                          <span key={`dots-a-${idx}`} className="px-2 text-muted-foreground">
                            …
                          </span>
                        ) : (
                          <Button
                            key={n}
                            variant={n === computedActive.safePage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActivePage(n)}
                            className="min-w-[36px]"
                          >
                            {n}
                          </Button>
                        )
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePage((p) => Math.min(computedActive.totalPages, p + 1))}
                        disabled={computedActive.safePage >= computedActive.totalPages}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePage(computedActive.totalPages)}
                        disabled={computedActive.safePage >= computedActive.totalPages}
                        aria-label="Última página"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="history" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Select value={historyStatusFilter} onValueChange={(v: any) => setHistoryStatusFilter(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      <SelectItem value="COMPLETADA">Completada</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  {computedHistory.total === 0
                    ? 'Sin resultados'
                    : `Mostrando ${computedHistory.startIdx + 1}–${computedHistory.endIdx} de ${computedHistory.total}`}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner className="size-6" />
                  </div>
                ) : computedHistory.total === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No hay subastas históricas con los filtros actuales.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {computedHistory.pageItems.map((auction) => (
                      <AuctionCard
                        key={auction.id}
                        auction={auction as any}
                        onUpdate={() => {}}
                        clock={{ nowMs: syncedNowMs, serverOffsetMs, tickMs: adaptiveTickMs }}
                        imageSizes={gridImageSizes}
                        imageQuality={82}
                      />
                    ))}
                  </div>
                )}

                {!loading && computedHistory.totalPages > 1 ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {computedHistory.safePage} de {computedHistory.totalPages}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(1)}
                        disabled={computedHistory.safePage <= 1}
                        aria-label="Primera página"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={computedHistory.safePage <= 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {computedHistory.pageNumbers.map((n, idx) =>
                        n === -1 ? (
                          <span key={`dots-h-${idx}`} className="px-2 text-muted-foreground">
                            …
                          </span>
                        ) : (
                          <Button
                            key={n}
                            variant={n === computedHistory.safePage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setHistoryPage(n)}
                            className="min-w-[36px]"
                          >
                            {n}
                          </Button>
                        )
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.min(computedHistory.totalPages, p + 1))}
                        disabled={computedHistory.safePage >= computedHistory.totalPages}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(computedHistory.totalPages)}
                        disabled={computedHistory.safePage >= computedHistory.totalPages}
                        aria-label="Última página"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
