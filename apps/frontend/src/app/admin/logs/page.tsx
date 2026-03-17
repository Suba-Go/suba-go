'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Clock, Gavel, UserCheck, AlertTriangle, Plus, Eye, ShieldCheck } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  eventType: 'auction' | 'bid' | 'adjudication' | 'user' | 'system';
  user: string;
  auctionId?: string;
  auctionTitle?: string;
  detail: string;
}

const EVENT_CONFIG = {
  auction: { icon: <Gavel size={14} />, label: 'Subasta', color: 'text-blue-400 bg-blue-500/10' },
  bid: { icon: <Plus size={14} />, label: 'Puja', color: 'text-green-400 bg-green-500/10' },
  adjudication: { icon: <ShieldCheck size={14} />, label: 'Adjudicación', color: 'text-yellow-400 bg-yellow-500/10' },
  user: { icon: <UserCheck size={14} />, label: 'Usuario', color: 'text-purple-400 bg-purple-500/10' },
  system: { icon: <AlertTriangle size={14} />, label: 'Sistema', color: 'text-stone-400 bg-stone-500/10' },
};

export default function AdminLogsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const perPage = 30;

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const logs = useMemo((): LogEntry[] => {
    if (!data) return [];
    const entries: LogEntry[] = [];
    const auctions = data.auctions || [];
    const bids = data.bids || [];
    const soldItems = data.soldItems || [];
    const users = data.users || [];
    const companies = data.companies || [];

    // Auction created events
    auctions.forEach((a: any) => {
      const company = companies.find((c: any) => c.tenantId === a._tenantId);
      entries.push({
        id: `auction-created-${a.id}`,
        timestamp: a.createdAt,
        event: 'Subasta creada',
        eventType: 'auction',
        user: company?.name || 'Sistema',
        auctionId: a.id,
        auctionTitle: a.title,
        detail: `${a.title} · ${a.items?.length || 0} autos`,
      });

      // Auction status changes (simulate close events for COMPLETADA)
      if (a.status === 'COMPLETADA' && a.endDate) {
        entries.push({
          id: `auction-closed-${a.id}`,
          timestamp: a.endDate,
          event: 'Subasta cerrada',
          eventType: 'auction',
          user: 'Sistema',
          auctionId: a.id,
          auctionTitle: a.title,
          detail: `${a.title} finalizada`,
        });
      }
    });

    // Bid events
    bids.forEach((bid: any) => {
      const user = users.find((u: any) => u.id === bid.userId);
      const auction = auctions.find((a: any) => a.id === bid.auctionId);
      entries.push({
        id: `bid-${bid.id}`,
        timestamp: bid.createdAt,
        event: 'Usuario ofertó',
        eventType: 'bid',
        user: user?.name || user?.email || `User ${bid.userId?.slice(0, 6)}`,
        auctionId: bid.auctionId,
        auctionTitle: auction?.title,
        detail: `${formatCLP(bid.amount)} en ${auction?.title || 'subasta'}`,
      });
    });

    // Adjudication events
    soldItems.forEach((item: any) => {
      const winner = users.find((u: any) => u.id === item.winnerId);
      const auction = auctions.find((a: any) => a.id === item.auctionId);
      entries.push({
        id: `adj-${item.id}`,
        timestamp: item.updatedAt || item.createdAt,
        event: 'Adjudicación',
        eventType: 'adjudication',
        user: winner?.name || winner?.email || 'Usuario',
        auctionId: item.auctionId,
        auctionTitle: auction?.title,
        detail: `${item.brand} ${item.model} ${item.year} por ${formatCLP(item.soldPrice || 0)}`,
      });
    });

    // User registration events
    users.forEach((u: any) => {
      entries.push({
        id: `user-reg-${u.id}`,
        timestamp: u.createdAt,
        event: 'Usuario registrado',
        eventType: 'user',
        user: u.name || u.email || `User ${u.id?.slice(0, 6)}`,
        detail: u.email || '',
      });
    });

    // Sort by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [data]);

  const filtered = useMemo(() => {
    let result = logs;
    if (typeFilter) result = result.filter((l) => l.eventType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.event.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q) ||
        (l.auctionTitle || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, search, typeFilter]);

  const paginated = useMemo(() => {
    return filtered.slice(page * perPage, (page + 1) * perPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / perPage);

  // Group logs by date for timeline effect
  const grouped = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    paginated.forEach((entry) => {
      const dateKey = new Date(entry.timestamp).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return groups;
  }, [paginated]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Logs del sistema</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-12 rounded-lg bg-stone-800/50" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs del sistema</h1>
        <p className="text-sm text-stone-400">{filtered.length} eventos registrados</p>
      </div>

      {/* Event type summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_CONFIG).map(([type, config]) => {
          const count = logs.filter((l) => l.eventType === type).length;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === type
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : 'border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <span className={config.color.split(' ')[0]}>{config.icon}</span>
              {config.label}
              <span className="ml-1 rounded-full bg-stone-800 px-1.5 py-0.5 text-[10px] tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Buscar en logs..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([dateKey, entries]) => (
          <div key={dateKey}>
            <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 py-1">
              <Clock size={12} className="text-stone-600" />
              <span className="text-xs font-medium capitalize text-stone-500">{dateKey}</span>
              <div className="h-px flex-1 bg-stone-800" />
            </div>
            <div className="space-y-1 pl-4 border-l border-stone-800">
              {entries.map((entry) => {
                const config = EVENT_CONFIG[entry.eventType];
                return (
                  <div
                    key={entry.id}
                    className="group relative flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-stone-800/30"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] top-3.5 h-2 w-2 rounded-full border-2 border-stone-700 bg-stone-900" />

                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-stone-200">{entry.event}</span>
                        <span className="text-xs text-stone-500">por <span className="text-stone-400">{entry.user}</span></span>
                      </div>
                      <p className="text-xs text-stone-500">{entry.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs tabular-nums text-stone-600">{formatTime(entry.timestamp)}</p>
                      {entry.auctionId && (
                        <a
                          href={`/admin/subastas/${entry.auctionId}`}
                          className="text-[10px] text-stone-600 hover:text-yellow-500"
                        >
                          ID: {entry.auctionId.slice(0, 8)}...
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-stone-500">No se encontraron eventos</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-800 pt-4">
          <p className="text-xs text-stone-500">
            Mostrando {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-stone-700 px-3 py-1 text-xs text-stone-400 hover:bg-stone-800 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="rounded-md border border-stone-700 px-3 py-1 text-xs text-stone-400 hover:bg-stone-800 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
